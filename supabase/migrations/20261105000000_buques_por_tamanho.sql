-- Buquês por tamanho (pequeno, médio, grande) montados com as flores que o
-- cliente escolhe. Cada flor tem estoque próprio, em hastes.

-- ---------------------------------------------------------------------------
-- Flores
-- ---------------------------------------------------------------------------

create table public.flowers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  -- Acréscimo por haste no preço do buquê (ex.: orquídea custa mais).
  extra_price_cents int not null default 0 check (extra_price_cents >= 0),
  stock int not null default 0,
  low_stock_threshold int not null default 10,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flowers enable row level security;
create policy "flores públicas" on public.flowers for select using (active or (select public.is_admin()));
create policy "admin flores" on public.flowers for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Buquê montável: quantas flores o cliente escolhe. Nulo = produto comum.
alter table public.products
  add column flower_count int check (flower_count is null or flower_count > 0);

comment on column public.products.flower_count is
  'Buquê montável: o cliente escolhe esta quantidade de flores. O estoque baixado é o das flores, não o do produto.';

-- Flores escolhidas para cada unidade do item: [{"flower_id","name","quantity"}].
alter table public.order_items add column flowers jsonb;

-- ---------------------------------------------------------------------------
-- Movimentações de estoque também para flores
-- ---------------------------------------------------------------------------

alter table public.stock_movements
  alter column product_id drop not null,
  add column flower_id uuid references public.flowers (id) on delete cascade,
  add constraint stock_movements_one_target check (num_nonnulls(product_id, flower_id) = 1);

create index stock_movements_flower_idx on public.stock_movements (flower_id);

create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.flower_id is not null then
    update public.flowers
       set stock = stock + new.quantity,
           updated_at = now()
     where id = new.flower_id;
  else
    update public.products
       set stock = stock + new.quantity,
           updated_at = now()
     where id = new.product_id;
  end if;
  return new;
end;
$$;

revoke execute on function public.apply_stock_movement() from public, anon, authenticated;

-- Hastes de cada flor consumidas por um pedido (quantidade do item × flores por unidade).
create or replace function public.order_flower_usage(p_order_id uuid)
returns table (flower_id uuid, name text, quantity int)
language sql
stable
set search_path = ''
as $$
  select (f ->> 'flower_id')::uuid, min(f ->> 'name'), sum(oi.quantity * (f ->> 'quantity')::int)::int
    from public.order_items oi
    cross join lateral jsonb_array_elements(oi.flowers) f
   where oi.order_id = p_order_id
     and oi.flowers is not null
   group by 1;
$$;

revoke execute on function public.order_flower_usage(uuid) from public, anon, authenticated;

-- Confirma o pagamento e baixa o estoque dos produtos comuns e das flores dos buquês.
create or replace function public.confirm_order_payment(
  p_order_id uuid,
  p_payment_id text,
  p_payment_method text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_channel text;
  v_reason text;
  v_short text;
  v_short_flowers text;
begin
  update public.orders
     set status = 'pago',
         mp_payment_id = p_payment_id,
         payment_method = p_payment_method,
         paid_at = now(),
         updated_at = now()
   where id = p_order_id
     and status = 'aguardando_pagamento'
  returning channel into v_channel;

  if not found then
    return false;
  end if;

  v_reason := case when v_channel = 'balcao' then 'venda_balcao' else 'venda_online' end;

  -- Trava produtos e flores para que pagamentos simultâneos não leiam o mesmo saldo.
  perform 1
    from public.products p
   where p.id in (select product_id from public.order_items where order_id = p_order_id and flowers is null)
   order by p.id
   for update;

  perform 1
    from public.flowers f
   where f.id in (select u.flower_id from public.order_flower_usage(p_order_id) u)
   order by f.id
   for update;

  select string_agg(oi.product_name, ', ')
    into v_short
    from public.order_items oi
    join public.products p on p.id = oi.product_id
   where oi.order_id = p_order_id
     and oi.flowers is null
     and p.stock < oi.quantity;

  select string_agg(u.name, ', ')
    into v_short_flowers
    from public.order_flower_usage(p_order_id) u
    join public.flowers f on f.id = u.flower_id
   where f.stock < u.quantity;

  if v_short is not null or v_short_flowers is not null then
    update public.orders
       set stock_issue = 'Estoque insuficiente no pagamento: ' || concat_ws(', ', v_short, v_short_flowers)
     where id = p_order_id;
  end if;

  insert into public.stock_movements (product_id, quantity, reason, order_id)
  select oi.product_id, -oi.quantity, v_reason, p_order_id
    from public.order_items oi
   where oi.order_id = p_order_id
     and oi.product_id is not null
     and oi.flowers is null;

  insert into public.stock_movements (flower_id, quantity, reason, order_id)
  select u.flower_id, -u.quantity, v_reason, p_order_id
    from public.order_flower_usage(p_order_id) u
    join public.flowers f on f.id = u.flower_id;

  return true;
end;
$$;

revoke execute on function public.confirm_order_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.confirm_order_payment(uuid, text, text) to service_role;

-- Cancela um pedido. Se já estava pago, devolve produtos e flores ao estoque.
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_was_paid boolean;
begin
  if not public.is_admin() and (select auth.role()) is distinct from 'service_role' then
    raise exception 'Apenas a administração pode cancelar pedidos';
  end if;

  select paid_at is not null into v_was_paid
    from public.orders
   where id = p_order_id and status <> 'cancelado'
   for update;

  if not found then
    return;
  end if;

  update public.orders set status = 'cancelado', updated_at = now() where id = p_order_id;

  if v_was_paid then
    insert into public.stock_movements (product_id, quantity, reason, order_id)
    select oi.product_id, oi.quantity, 'cancelamento', p_order_id
      from public.order_items oi
     where oi.order_id = p_order_id
       and oi.product_id is not null
       and oi.flowers is null;

    insert into public.stock_movements (flower_id, quantity, reason, order_id)
    select u.flower_id, u.quantity, 'cancelamento', p_order_id
      from public.order_flower_usage(p_order_id) u
      join public.flowers f on f.id = u.flower_id;
  end if;
end;
$$;

revoke execute on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated, service_role;

-- Venda no balcão. Buquês montáveis levam as flores escolhidas:
-- p_items: [{"product_id": "...", "quantity": 1, "flowers": [{"flower_id": "...", "quantity": 5}]}]
create or replace function public.register_counter_sale(
  p_items jsonb,
  p_payment_method text,
  p_customer_name text default 'Cliente balcão',
  p_customer_cpf text default null,
  p_discount_cents int default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_subtotal int;
  v_item jsonb;
  v_product record;
  v_flowers jsonb;
  v_count int;
  v_extra int;
begin
  if not public.is_admin() then
    raise exception 'Apenas a administração pode registrar vendas no balcão';
  end if;

  insert into public.orders (channel, status, fulfillment, customer_name, customer_cpf, discount_cents)
  values ('balcao', 'aguardando_pagamento', 'retirada', p_customer_name, p_customer_cpf, greatest(p_discount_cents, 0))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select id, name, price_cents, flower_count into v_product
      from public.products where id = (v_item ->> 'product_id')::uuid;
    if not found then
      raise exception 'Produto não encontrado';
    end if;

    v_flowers := null;
    v_extra := 0;
    if v_product.flower_count is not null then
      select jsonb_agg(jsonb_build_object('flower_id', f.id, 'name', f.name, 'quantity', (x ->> 'quantity')::int) order by f.position, f.name),
             coalesce(sum((x ->> 'quantity')::int), 0),
             coalesce(sum((x ->> 'quantity')::int * f.extra_price_cents), 0)
        into v_flowers, v_count, v_extra
        from jsonb_array_elements(coalesce(v_item -> 'flowers', '[]'::jsonb)) x
        join public.flowers f on f.id = (x ->> 'flower_id')::uuid
       where (x ->> 'quantity')::int > 0;
      if v_count is distinct from v_product.flower_count then
        raise exception '% precisa de % flores', v_product.name, v_product.flower_count;
      end if;
    end if;

    insert into public.order_items (order_id, product_id, product_name, unit_price_cents, quantity, flowers)
    values (v_order_id, v_product.id, v_product.name, v_product.price_cents + v_extra, (v_item ->> 'quantity')::int, v_flowers);
  end loop;

  select coalesce(sum(unit_price_cents * quantity), 0) into v_subtotal
    from public.order_items where order_id = v_order_id;

  if v_subtotal = 0 then
    raise exception 'Venda sem itens';
  end if;

  update public.orders
     set subtotal_cents = v_subtotal,
         total_cents = greatest(v_subtotal - discount_cents, 0)
   where id = v_order_id;

  perform public.confirm_order_payment(v_order_id, null, p_payment_method);
  update public.orders set status = 'retirado' where id = v_order_id;

  return v_order_id;
end;
$$;

revoke execute on function public.register_counter_sale(jsonb, text, text, text, int) from public, anon;
grant execute on function public.register_counter_sale(jsonb, text, text, text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Catálogo novo: só os três tamanhos de buquê
-- ---------------------------------------------------------------------------

insert into public.flowers (slug, name, extra_price_cents, position) values
  ('rosa', 'Rosa', 0, 1),
  ('margarida', 'Margarida', 0, 2),
  ('orquidea', 'Orquídea', 0, 3),
  ('lirio', 'Lírio', 0, 4),
  ('girassol', 'Girassol', 0, 5),
  ('cravo', 'Cravo', 0, 6)
on conflict (slug) do nothing;

-- Os produtos antigos saem da vitrine, mas não são apagados: o histórico
-- de vendas e de estoque continua apontando para eles.
update public.products set active = false, featured = false where flower_count is null;

insert into public.products (slug, name, description, category_id, price_cents, stock, featured, image_url, flower_count) values
  ('buque-pequeno', 'Buquê Pequeno', 'Buquê delicado com 10 flores que você escolhe, embalado à mão com papel e laço de cetim.', (select id from public.categories where slug = 'buques'), 14900, 0, true, '/fotos/buque-doce-rosa.jpg', 10),
  ('buque-medio', 'Buquê Médio', 'Buquê com 20 flores que você escolhe, com folhagens e acabamento do ateliê.', (select id from public.categories where slug = 'buques'), 24900, 0, true, '/fotos/buque-rose.jpg', 20),
  ('buque-grande', 'Buquê Grande', 'Buquê volumoso com 30 flores que você escolhe, para presentear em grande estilo.', (select id from public.categories where slug = 'buques'), 34900, 0, true, '/fotos/buque-jardim-bordo.jpg', 30)
on conflict (slug) do update set flower_count = excluded.flower_count, active = true;
