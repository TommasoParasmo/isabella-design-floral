-- Ajustes da revisão da etapa 2.

alter table public.orders add column stock_issue text;

-- O webhook chama estas funções com a chave service role. O Supabase já
-- concede por padrão, mas deixamos explícito para ambientes novos.
grant execute on function public.confirm_order_payment(uuid, text, text) to service_role;
grant execute on function public.cancel_order(uuid) to service_role;

-- Confirma o pagamento travando os produtos. Se outro pedido levou as
-- últimas unidades entre o checkout e o pagamento, o pedido continua pago
-- (o dinheiro já entrou), mas fica sinalizado para a Isa resolver
-- (trocar a peça ou estornar). O saldo negativo aparece em vermelho no painel.
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
  v_short text;
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

  -- Trava os produtos do pedido para que pagamentos simultâneos não leiam o mesmo saldo.
  perform 1
    from public.products p
   where p.id in (select product_id from public.order_items where order_id = p_order_id)
   order by p.id
   for update;

  select string_agg(oi.product_name, ', ')
    into v_short
    from public.order_items oi
    join public.products p on p.id = oi.product_id
   where oi.order_id = p_order_id
     and p.stock < oi.quantity;

  if v_short is not null then
    update public.orders
       set stock_issue = 'Estoque insuficiente no pagamento: ' || v_short
     where id = p_order_id;
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

revoke execute on function public.confirm_order_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.confirm_order_payment(uuid, text, text) to service_role;
