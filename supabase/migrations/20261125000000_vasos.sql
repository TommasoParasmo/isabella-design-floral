-- Aba "Vasos" na loja: vasos vendidos sozinhos, separados dos arranjos.

-- Categoria com aba própria: os produtos dela não aparecem em "Todos" nem em
-- "Agende sua entrega", só na aba da categoria.
alter table public.categories add column if not exists own_tab boolean not null default false;

-- NCM dos produtos da categoria, usado na nota fiscal. Nulo = flores (06031900).
alter table public.categories add column if not exists ncm text;

insert into public.categories (slug, name, description, position, own_tab, ncm) values
  ('vasos', 'Vasos', 'Vasos para levar sozinhos, presentear ou receber as suas flores.', 5, true, '69139000')
on conflict (slug) do update set own_tab = true, ncm = coalesce(public.categories.ncm, excluded.ncm);
