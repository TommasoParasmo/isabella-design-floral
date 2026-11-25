-- Clube dos Desatentos: plano anual com um número fixo de entregas no ano.
-- Nesta primeira fase a venda é pelo WhatsApp: a página mostra os planos e a
-- Isa combina as datas com o cliente. Tudo aqui é editável no Painel.

create table public.clube_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  deliveries int not null check (deliveries between 1 and 52),
  price_cents int not null check (price_cents >= 0),
  -- Preço "de" (riscado). Nulo quando não há desconto para mostrar.
  list_price_cents int check (list_price_cents is null or list_price_cents >= 0),
  badge text,
  description text,
  active boolean not null default true,
  position int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.clube_plans enable row level security;

create policy "clube planos públicos" on public.clube_plans for select
  using (active or (select public.is_admin()));
create policy "admin clube planos" on public.clube_plans for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Valores do rascunho da Isa (ainda vão mudar; ela ajusta no Painel).
insert into public.clube_plans (name, deliveries, price_cents, badge, position) values
  ('Plano Essencial', 4, 56900, null, 1),
  ('Plano Querido', 6, 84900, 'Mais escolhido', 2),
  ('Plano Inesquecível', 8, 112900, null, 3);
