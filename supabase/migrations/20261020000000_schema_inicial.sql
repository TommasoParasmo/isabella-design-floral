-- Isabella Parasmo Designer Floral: esquema inicial
-- Vitrine, estoque, pedidos agendados, assinaturas, workshops e documentos fiscais.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Perfis e administração
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  cpf text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.profiles where id = (select auth.uid())),
    false
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  recipient text not null,
  cep text not null,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null default 'São Paulo',
  state text not null default 'SP',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catálogo e estoque
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  position int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  price_cents int not null check (price_cents >= 0),
  image_url text,
  stock int not null default 0,
  low_stock_threshold int not null default 3,
  featured boolean not null default false,
  active boolean not null default true,
  -- Dados fiscais (NFC-e / NF-e)
  ncm text not null default '06031900',
  cfop text not null default '5102',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);

-- Toda entrada e saída de estoque fica registrada aqui.
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  quantity int not null, -- positivo = entrada, negativo = saída
  reason text not null check (reason in ('compra', 'venda_online', 'venda_balcao', 'perda', 'ajuste', 'cancelamento')),
  order_id uuid,
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index stock_movements_product_idx on public.stock_movements (product_id);

create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
     set stock = stock + new.quantity,
         updated_at = now()
   where id = new.product_id;
  return new;
end;
$$;

create trigger stock_movements_apply
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- ---------------------------------------------------------------------------
-- Pedidos (online e balcão) com entrega agendada
-- ---------------------------------------------------------------------------

create table public.delivery_slots (
  id uuid primary key default gen_random_uuid(),
  label text not null,          -- ex.: "Manhã (9h às 12h)"
  starts_at time not null,
  ends_at time not null,
  fee_cents int not null default 0,
  max_orders int not null default 10,
  active boolean not null default true
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  profile_id uuid references public.profiles (id) on delete set null,
  channel text not null default 'online' check (channel in ('online', 'balcao')),
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento', 'pago', 'em_preparo', 'saiu_para_entrega', 'entregue', 'retirado', 'cancelado')),
  fulfillment text not null default 'entrega' check (fulfillment in ('entrega', 'retirada')),
  customer_name text not null,
  customer_phone text,
  customer_email text,
  customer_cpf text,
  -- Agendamento
  scheduled_date date,
  delivery_slot_id uuid references public.delivery_slots (id),
  recipient_name text,
  card_message text,
  delivery_address jsonb,
  -- Valores
  subtotal_cents int not null default 0,
  delivery_fee_cents int not null default 0,
  discount_cents int not null default 0,
  total_cents int not null default 0,
  -- Pagamento (Mercado Pago)
  payment_method text,
  mp_preference_id text,
  mp_payment_id text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_profile_idx on public.orders (profile_id);
create index orders_scheduled_idx on public.orders (scheduled_date);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0)
);

create index order_items_order_idx on public.order_items (order_id);

alter table public.stock_movements
  add constraint stock_movements_order_fk
  foreign key (order_id) references public.orders (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Assinaturas florais
-- ---------------------------------------------------------------------------

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  frequency text not null check (frequency in ('semanal', 'quinzenal', 'mensal')),
  price_cents int not null check (price_cents >= 0),
  image_url text,
  perks text[] not null default '{}',
  active boolean not null default true,
  position int not null default 0
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id),
  status text not null default 'pendente'
    check (status in ('pendente', 'ativa', 'pausada', 'cancelada')),
  address_id uuid references public.addresses (id),
  preferred_weekday int check (preferred_weekday between 0 and 6),
  delivery_slot_id uuid references public.delivery_slots (id),
  mp_preapproval_id text,
  next_delivery_date date,
  started_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now()
);

create index subscriptions_profile_idx on public.subscriptions (profile_id);

-- ---------------------------------------------------------------------------
-- Workshops
-- ---------------------------------------------------------------------------

create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  starts_at timestamptz not null,
  duration_minutes int not null default 180,
  location text not null default 'Ateliê Isabella Parasmo',
  price_cents int not null check (price_cents >= 0),
  capacity int not null check (capacity > 0),
  image_url text,
  includes text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.workshop_registrations (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  cpf text,
  seats int not null default 1 check (seats > 0),
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento', 'confirmada', 'cancelada')),
  mp_payment_id text,
  created_at timestamptz not null default now()
);

create index workshop_registrations_workshop_idx on public.workshop_registrations (workshop_id);

-- Vagas restantes, visível publicamente sem expor as inscrições
create or replace function public.workshop_availability()
returns table (workshop_id uuid, seats_left int)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.id,
    (w.capacity - coalesce(sum(r.seats) filter (where r.status <> 'cancelada'), 0))::int
  from public.workshops w
  left join public.workshop_registrations r on r.workshop_id = w.id
  where w.active
  group by w.id;
$$;

-- ---------------------------------------------------------------------------
-- Documentos fiscais (NFC-e, NF-e, NFS-e) emitidos via API
-- ---------------------------------------------------------------------------

create table public.fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('nfce', 'nfe', 'nfse')),
  order_id uuid references public.orders (id) on delete set null,
  workshop_registration_id uuid references public.workshop_registrations (id) on delete set null,
  provider text not null default 'focusnfe',
  provider_ref text not null unique,
  environment text not null default 'homologacao' check (environment in ('homologacao', 'producao')),
  status text not null default 'processando'
    check (status in ('processando', 'autorizado', 'rejeitado', 'cancelado', 'erro')),
  number text,
  series text,
  access_key text,
  pdf_url text,
  xml_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.delivery_slots enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.workshops enable row level security;
alter table public.workshop_registrations enable row level security;
alter table public.fiscal_documents enable row level security;

-- Perfis: cada um vê o seu; admin vê todos
create policy "perfil próprio" on public.profiles
  for select using ((select auth.uid()) = id or (select public.is_admin()));
create policy "atualiza perfil próprio" on public.profiles
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id and is_admin = (select public.is_admin()));

create policy "endereços próprios" on public.addresses
  for all using ((select auth.uid()) = profile_id or (select public.is_admin()))
  with check ((select auth.uid()) = profile_id or (select public.is_admin()));

-- Catálogo: leitura pública do que está ativo; escrita só admin
create policy "categorias públicas" on public.categories for select using (true);
create policy "admin categorias" on public.categories for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "produtos públicos" on public.products for select using (active or (select public.is_admin()));
create policy "admin produtos" on public.products for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin estoque" on public.stock_movements for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "horários públicos" on public.delivery_slots for select using (active or (select public.is_admin()));
create policy "admin horários" on public.delivery_slots for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Pedidos: criados pelo servidor (service role); cliente lê os seus
create policy "pedidos próprios" on public.orders
  for select using ((select auth.uid()) = profile_id or (select public.is_admin()));
create policy "admin pedidos" on public.orders for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "itens de pedidos próprios" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.profile_id = (select auth.uid()) or (select public.is_admin())))
  );
create policy "admin itens" on public.order_items for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "planos públicos" on public.subscription_plans for select using (active or (select public.is_admin()));
create policy "admin planos" on public.subscription_plans for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "assinaturas próprias" on public.subscriptions
  for select using ((select auth.uid()) = profile_id or (select public.is_admin()));
create policy "admin assinaturas" on public.subscriptions for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "workshops públicos" on public.workshops for select using (active or (select public.is_admin()));
create policy "admin workshops" on public.workshops for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "inscrições próprias" on public.workshop_registrations
  for select using ((select auth.uid()) = profile_id or (select public.is_admin()));
create policy "admin inscrições" on public.workshop_registrations for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin fiscal" on public.fiscal_documents for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant execute on function public.workshop_availability() to anon, authenticated;

-- Funções de gatilho não devem ser chamadas pela API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.apply_stock_movement() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: fotos de produtos
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

create policy "admin envia fotos" on storage.objects for insert
  with check (bucket_id = 'produtos' and (select public.is_admin()));
create policy "admin altera fotos" on storage.objects for update
  using (bucket_id = 'produtos' and (select public.is_admin()));
create policy "admin remove fotos" on storage.objects for delete
  using (bucket_id = 'produtos' and (select public.is_admin()));
