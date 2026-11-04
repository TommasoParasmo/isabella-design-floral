-- Painel de vendas: hoje, mês e ano no fuso de São Paulo, agregado no banco.
-- Entra o que foi pago: pedidos (online e balcão), inscrições confirmadas em
-- workshops e assinaturas-presente pagas. As cobranças mensais das
-- assinaturas recorrentes ficam no Mercado Pago e não são registradas aqui.
create or replace function public.sales_report()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_now timestamp := now() at time zone 'America/Sao_Paulo';
  v_today date := v_now::date;
  v_month date := date_trunc('month', v_now)::date;
  v_year date := date_trunc('year', v_now)::date;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Somente administradoras';
  end if;

  with sales as (
    select (coalesce(o.paid_at, o.created_at) at time zone 'America/Sao_Paulo')::date as day,
           o.channel as source, o.total_cents as amount
      from public.orders o
     where o.status not in ('aguardando_pagamento', 'cancelado')
       and coalesce(o.paid_at, o.created_at) >= (v_year::timestamp at time zone 'America/Sao_Paulo')
    union all
    select (r.created_at at time zone 'America/Sao_Paulo')::date, 'workshop', r.total_cents
      from public.workshop_registrations r
     where r.status = 'confirmada'
       and r.created_at >= (v_year::timestamp at time zone 'America/Sao_Paulo')
    union all
    select (coalesce(s.started_at, s.created_at) at time zone 'America/Sao_Paulo')::date, 'assinatura', s.total_cents
      from public.subscriptions s
     where s.kind = 'presente' and s.status <> 'pendente' and s.mp_payment_id is not null
       and coalesce(s.started_at, s.created_at) >= (v_year::timestamp at time zone 'America/Sao_Paulo')
  ),
  periods as (
    select p.key,
           coalesce(sum(s.amount), 0)::bigint as total,
           count(s.amount)::int as count,
           p.since
      from (values ('hoje', v_today), ('mes', v_month), ('ano', v_year)) as p(key, since)
      left join sales s on s.day >= p.since
     group by p.key, p.since
  ),
  by_source as (
    select p.key, jsonb_object_agg(x.source, jsonb_build_object('total', x.total, 'count', x.count)) as sources
      from (values ('hoje', v_today), ('mes', v_month), ('ano', v_year)) as p(key, since)
      join lateral (
        select s.source, sum(s.amount)::bigint as total, count(*)::int as count
          from sales s where s.day >= p.since group by s.source
      ) x on true
     group by p.key
  ),
  daily as (
    select jsonb_agg(jsonb_build_object('day', d::date, 'total', coalesce(t.total, 0)) order by d) as series
      from generate_series(v_month, v_today, interval '1 day') d
      left join (select s.day, sum(s.amount)::bigint as total from sales s group by s.day) t on t.day = d::date
  ),
  monthly as (
    select jsonb_agg(jsonb_build_object('month', m::date, 'total', coalesce(t.total, 0)) order by m) as series
      from generate_series(v_year, v_month, interval '1 month') m
      left join (select date_trunc('month', s.day)::date as month, sum(s.amount)::bigint as total from sales s group by 1) t on t.month = m::date
  ),
  top_products as (
    select jsonb_agg(jsonb_build_object('name', x.name, 'quantity', x.quantity, 'total', x.total) order by x.total desc) as items
      from (
        select i.product_name as name, sum(i.quantity)::int as quantity, sum(i.quantity * i.unit_price_cents)::bigint as total
          from public.order_items i
          join public.orders o on o.id = i.order_id
         where o.status not in ('aguardando_pagamento', 'cancelado')
           and coalesce(o.paid_at, o.created_at) >= (v_month::timestamp at time zone 'America/Sao_Paulo')
         group by i.product_name
         order by 3 desc
         limit 5
      ) x
  ),
  payments as (
    select jsonb_object_agg(coalesce(x.method, 'outro'), x.total) as methods
      from (
        select o.payment_method as method, sum(o.total_cents)::bigint as total
          from public.orders o
         where o.status not in ('aguardando_pagamento', 'cancelado')
           and coalesce(o.paid_at, o.created_at) >= (v_month::timestamp at time zone 'America/Sao_Paulo')
         group by 1
      ) x
  ),
  recurring as (
    select count(*)::int as active, coalesce(sum(pl.price_cents), 0)::bigint as monthly
      from public.subscriptions s
      join public.subscription_plans pl on pl.id = s.plan_id
     where s.kind = 'recorrente' and s.status = 'ativa'
  )
  select jsonb_build_object(
           'today', v_today,
           'periods', (select jsonb_object_agg(p.key, jsonb_build_object('total', p.total, 'count', p.count, 'sources', coalesce(b.sources, '{}'::jsonb)))
                         from periods p left join by_source b on b.key = p.key),
           'daily', (select series from daily),
           'monthly', (select series from monthly),
           'top_products', coalesce((select items from top_products), '[]'::jsonb),
           'payment_methods', coalesce((select methods from payments), '{}'::jsonb),
           'recurring', (select jsonb_build_object('active', active, 'monthly', monthly) from recurring)
         )
    into v_result;
  return v_result;
end;
$$;

revoke execute on function public.sales_report() from public, anon;
grant execute on function public.sales_report() to authenticated;
