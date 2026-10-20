-- Etapa 2: vendas online, entrega para hoje e venda no balcão.

alter table public.products
  add column same_day boolean not null default true;

comment on column public.products.same_day is 'Pode ser entregue no mesmo dia (dentro do horário de corte).';

-- Confirma o pagamento de um pedido e baixa o estoque. Idempotente: só age
-- quando o pedido ainda está aguardando pagamento. Chamada pelo servidor
-- (service role) a partir do webhook do Mercado Pago.
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

  insert into public.stock_movements (product_id, quantity, reason, order_id)
  select oi.product_id,
         -oi.quantity,
         case when v_channel = 'balcao' then 'venda_balcao' else 'venda_online' end,
         p_order_id
    from public.order_items oi
   where oi.order_id = p_order_id
     and oi.product_id is not null;

  return true;
end;
$$;

-- Cancela um pedido. Se já estava pago, devolve os itens ao estoque.
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
       and oi.product_id is not null;
  end if;
end;
$$;

-- Venda no balcão feita pela Isa no painel: cria o pedido já pago e baixa o estoque.
-- p_items: [{"product_id": "...", "quantity": 1}, ...]
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
begin
  if not public.is_admin() then
    raise exception 'Apenas a administração pode registrar vendas no balcão';
  end if;

  insert into public.orders (channel, status, fulfillment, customer_name, customer_cpf, discount_cents)
  values ('balcao', 'aguardando_pagamento', 'retirada', p_customer_name, p_customer_cpf, greatest(p_discount_cents, 0))
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, unit_price_cents, quantity)
  select v_order_id, p.id, p.name, p.price_cents, (i ->> 'quantity')::int
    from jsonb_array_elements(p_items) i
    join public.products p on p.id = (i ->> 'product_id')::uuid;

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

revoke execute on function public.confirm_order_payment(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.cancel_order(uuid) from public, anon;
revoke execute on function public.register_counter_sale(jsonb, text, text, text, int) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.register_counter_sale(jsonb, text, text, text, int) to authenticated;
