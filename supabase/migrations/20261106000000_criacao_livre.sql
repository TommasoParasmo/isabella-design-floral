-- Criação livre: o cliente escolhe o tamanho e a Isa monta com as flores da
-- semana. Esses produtos não têm estoque próprio: não esgotam na loja e as
-- vendas (e cancelamentos) não lançam movimentação de estoque.

alter table public.products
  add column made_to_order boolean not null default false;

comment on column public.products.made_to_order is
  'Criação livre: feito na hora com as flores disponíveis. Sem controle de estoque.';

-- Criação livre não é buquê montável: o cliente não escolhe flores.
update public.products set made_to_order = true, flower_count = null where name ilike '%criação livre%';

create or replace function public.confirm_order_payment(p_order_id uuid, p_payment_id text, p_payment_method text)
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

  perform 1
    from public.products p
   where p.id in (select product_id from public.order_items where order_id = p_order_id and flowers is null)
     and not p.made_to_order
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
     and not p.made_to_order
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
    join public.products p on p.id = oi.product_id
   where oi.order_id = p_order_id
     and oi.flowers is null
     and not p.made_to_order;

  insert into public.stock_movements (flower_id, quantity, reason, order_id)
  select u.flower_id, -u.quantity, v_reason, p_order_id
    from public.order_flower_usage(p_order_id) u
    join public.flowers f on f.id = u.flower_id;

  return true;
end;
$$;

revoke execute on function public.confirm_order_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.confirm_order_payment(uuid, text, text) to service_role;

-- Cancelamento devolve ao estoque só o que saiu dele.
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
    select m.product_id, -sum(m.quantity)::int, 'cancelamento', p_order_id
      from public.stock_movements m
     where m.order_id = p_order_id
       and m.product_id is not null
       and m.reason in ('venda_online', 'venda_balcao')
     group by m.product_id;

    insert into public.stock_movements (flower_id, quantity, reason, order_id)
    select u.flower_id, u.quantity, 'cancelamento', p_order_id
      from public.order_flower_usage(p_order_id) u
      join public.flowers f on f.id = u.flower_id;
  end if;
end;
$$;

revoke execute on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated, service_role;

-- Endereço do ateliê nos workshops.
update public.workshops
   set location = 'Ateliê Isabella Parasmo · Rua Santa Justina, 501, Vila Olímpia'
 where location = 'Ateliê Isabella Parasmo';

alter table public.workshops
  alter column location set default 'Ateliê Isabella Parasmo · Rua Santa Justina, 501, Vila Olímpia';
