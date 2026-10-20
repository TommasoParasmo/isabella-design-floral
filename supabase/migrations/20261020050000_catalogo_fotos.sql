-- Catálogo com as fotos reais da Isa (public/fotos). Atualiza bancos que
-- já foram criados com os produtos de exemplo.

update public.categories set description = 'Arranjos em vasos para mesa, casa e recepções.' where slug = 'arranjos';

insert into public.products (slug, name, description, category_id, price_cents, stock, featured, image_url) values
  ('buque-rose', 'Buquê Rosé', 'Cravos e mini rosas em tons de rosa, em papel perolado com listras douradas e laço de cetim.', (select id from public.categories where slug = 'buques'), 24900, 10, true, '/fotos/buque-rose.jpg'),
  ('buque-doce-rosa', 'Buquê Doce Rosa', 'Cravos mesclados e mini rosas salmão, com papel perolado e fita rosa listrada.', (select id from public.categories where slug = 'buques'), 26900, 10, false, '/fotos/buque-doce-rosa.jpg'),
  ('buque-hortensias', 'Buquê Hortênsias', 'Hortênsias azuis e verdes, cravos brancos e mathiola rosé em papel rosa.', (select id from public.categories where slug = 'buques'), 27900, 8, true, '/fotos/buque-hortensias.jpg'),
  ('buque-lirios', 'Buquê Lírios', 'Lírios brancos e alstroemérias em papel amarelo-claro com laço de cetim.', (select id from public.categories where slug = 'buques'), 22900, 10, false, '/fotos/buque-lirios.jpg'),
  ('buque-jardim-bordo', 'Buquê Jardim Bordô', 'Buquê redondo com celósias, mini rosas, crisântemos brancos e limonium.', (select id from public.categories where slug = 'buques'), 29900, 6, true, '/fotos/buque-jardim-bordo.jpg'),
  ('arranjo-sol', 'Arranjo Sol', 'Rosas amarelas, alstroemérias, crisântemos e solidago em vaso de vidro.', (select id from public.categories where slug = 'arranjos'), 21900, 8, false, '/fotos/arranjo-sol.jpg'),
  ('arranjo-lirios', 'Arranjo Lírios e Ásters', 'Lírios rosa, ásters roxos e alstroemérias em vaso branco.', (select id from public.categories where slug = 'arranjos'), 25900, 6, false, '/fotos/arranjo-lirios.jpg'),
  ('arranjo-bordo', 'Arranjo Bordô', 'Celósias vermelhas, boca-de-leão e folhagens em vaso branco de cerâmica.', (select id from public.categories where slug = 'arranjos'), 28900, 6, true, '/fotos/arranjo-bordo.jpg'),
  ('arranjo-rubi', 'Arranjo Rubi', 'Rosas vermelhas, celósia verde e alstroemérias em vaso azul petróleo. Ideal para recepções.', (select id from public.categories where slug = 'arranjos'), 38900, 4, false, '/fotos/arranjo-rubi.jpg'),
  ('arranjo-campo', 'Arranjo Campo', 'Sempre-vivas, solidago e flores do campo coloridas em vaso de vidro.', (select id from public.categories where slug = 'arranjos'), 32900, 4, false, '/fotos/arranjo-campo.jpg')
on conflict (slug) do update set image_url = excluded.image_url where public.products.image_url is null;

-- Produtos de exemplo sem foto saem da vitrine. Ficam inativos (e não
-- apagados) para preservar qualquer histórico de estoque ou venda.
-- Categorias sem produto ativo deixam de aparecer no site.
update public.products set active = false, featured = false
 where slug in ('buque-bordo', 'buque-rose-antique', 'buque-campestre', 'arranjo-jardim-ingles', 'arranjo-orquidea', 'box-paixao', 'box-delicada', 'vela-aromatica');

update public.subscription_plans set image_url = '/fotos/arranjo-sol.jpg' where slug = 'essencial' and image_url is null;
update public.subscription_plans set image_url = '/fotos/arranjo-lirios.jpg' where slug = 'jardim' and image_url is null;
update public.subscription_plans set image_url = '/fotos/arranjo-bordo.jpg' where slug = 'atelie' and image_url is null;
update public.workshops set image_url = '/fotos/workshop-mesa.jpg' where slug in ('buque-de-noiva', 'arranjos-de-natal') and image_url is null;
