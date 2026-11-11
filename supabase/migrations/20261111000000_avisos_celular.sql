-- Avisos no celular: cada aparelho em que a Isa ativa as notificações do
-- painel guarda aqui o endereço de push do navegador. O webhook de pagamento
-- (service role) lê esta tabela para avisar de cada pedido pago.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device text,
  created_at timestamptz not null default now()
);

create index push_subscriptions_profile_idx on public.push_subscriptions (profile_id);

alter table public.push_subscriptions enable row level security;

-- Só administradoras cadastram aparelhos, e cada uma mexe só nos seus.
create policy "aparelhos da admin" on public.push_subscriptions
  for all
  using ((select auth.uid()) = profile_id and (select public.is_admin()))
  with check ((select auth.uid()) = profile_id and (select public.is_admin()));
