-- Várias fotos por produto e por workshop. A primeira da lista é a capa;
-- image_url continua guardando a capa para cards, carrinho e pedidos.

alter table public.products add column if not exists images text[] not null default '{}';
alter table public.workshops add column if not exists images text[] not null default '{}';

update public.products set images = array[image_url] where image_url is not null and cardinality(images) = 0;
update public.workshops set images = array[image_url] where image_url is not null and cardinality(images) = 0;
