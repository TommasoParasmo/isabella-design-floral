-- Promoções: desconto em % por categoria, produto ou workshop, com data de
-- início e fim (datas de São Paulo, incluindo o último dia). A Isa liga e
-- desliga cada uma no Painel. O preço com desconto é calculado no site e
-- conferido de novo no checkout, nunca vem do navegador.

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  percent_off int not null check (percent_off between 1 and 90),
  -- categoria | produto | workshops (todos) | workshop (um só)
  target text not null check (target in ('categoria', 'produto', 'workshops', 'workshop')),
  category_id uuid references public.categories (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  workshop_id uuid references public.workshops (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  check (
    (target = 'categoria' and category_id is not null) or
    (target = 'produto' and product_id is not null) or
    (target = 'workshops') or
    (target = 'workshop' and workshop_id is not null)
  )
);

alter table public.promotions enable row level security;

create policy "promoções públicas" on public.promotions for select
  using (active or (select public.is_admin()));
create policy "admin promoções" on public.promotions for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Black Friday 2026 (27/11 a 30/11), como a Isa pediu.
insert into public.promotions (name, percent_off, target, category_id, starts_on, ends_on)
select 'Black Friday · Vasos', 15, 'categoria', id, '2026-11-27', '2026-11-30' from public.categories where slug = 'vasos';

insert into public.promotions (name, percent_off, target, starts_on, ends_on)
values ('Black Friday · Workshops', 20, 'workshops', '2026-11-27', '2026-11-30');

insert into public.promotions (name, percent_off, target, product_id, starts_on, ends_on)
select 'Black Friday · ' || name, 20, 'produto', id, '2026-11-27', '2026-11-30'
from public.products
where active and category_id = (select id from public.categories where slug = 'natal')
  and (name ilike '%guirlanda%' or name ilike '%pinheiro%');
