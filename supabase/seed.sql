-- Dados iniciais de exemplo. A Isa troca nomes, preços e fotos pelo painel.

insert into public.categories (slug, name, description, position) values
  ('buques', 'Buquês', 'Buquês assinados, montados à mão no dia da entrega.', 1),
  ('arranjos', 'Arranjos', 'Arranjos em vasos para mesa, casa e recepções.', 2)
on conflict (slug) do nothing;

-- Fotos tiradas dos stories da Isa (public/fotos).
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
on conflict (slug) do nothing;

insert into public.delivery_slots (label, starts_at, ends_at, fee_cents, max_orders) values
  ('Manhã (9h às 12h)', '09:00', '12:00', 2500, 10),
  ('Tarde (13h às 17h)', '13:00', '17:00', 2500, 10),
  ('Noite (18h às 20h)', '18:00', '20:00', 3500, 6);

insert into public.subscription_plans (slug, name, description, frequency, price_cents, perks, position, image_url) values
  ('essencial', 'Essencial', 'Um arranjo fresco por mês para deixar a casa mais viva.', 'mensal', 14900, array['1 arranjo por mês', 'Flores da estação', 'Entrega grátis em SP'], 1, '/fotos/arranjo-sol.jpg'),
  ('jardim', 'Jardim', 'Flores a cada 15 dias, com curadoria da Isa.', 'quinzenal', 26900, array['2 arranjos por mês', 'Curadoria exclusiva', 'Entrega grátis em SP', '10% off na loja'], 2, '/fotos/arranjo-lirios.jpg'),
  ('atelie', 'Ateliê', 'Toda semana um arranjo novo, para casa ou escritório.', 'semanal', 49900, array['4 arranjos por mês', 'Vaso de presente na adesão', 'Entrega grátis em SP', '15% off em workshops'], 3, '/fotos/arranjo-bordo.jpg')
on conflict (slug) do nothing;

insert into public.workshops (slug, title, description, starts_at, duration_minutes, price_cents, capacity, includes, image_url) values
  ('buque-de-noiva', 'Buquê de Noiva', 'Aprenda a técnica espiral e monte seu próprio buquê com flores nobres.', '2026-11-14 14:00-03', 180, 39000, 10, array['Todas as flores e materiais', 'Café da tarde', 'Certificado'], '/fotos/workshop-mesa.jpg'),
  ('arranjos-de-natal', 'Arranjos de Natal', 'Guirlanda e centro de mesa natalino com folhagens e flores secas.', '2026-12-05 10:00-03', 240, 45000, 12, array['Todos os materiais', 'Brunch', 'Peças para levar para casa'], '/fotos/workshop-mesa.jpg')
on conflict (slug) do nothing;

-- Coleção sazonal de Natal (aparece na home de 1/11 a 25/12)
insert into public.categories (slug, name, description, position, seasonal, active_from, active_until, headline) values
  ('natal', 'Natal', 'Guirlandas, centros de mesa e arranjos para as festas.', 0, true, '2026-11-01', '2026-12-25', 'Coleção de Natal')
on conflict (slug) do nothing;

insert into public.products (slug, name, description, category_id, price_cents, stock, featured, same_day) values
  ('guirlanda-bordo', 'Guirlanda Bordô', 'Guirlanda de pinheiro natural com rosas secas e fita de veludo vinho.', (select id from public.categories where slug = 'natal'), 32900, 10, false, false),
  ('centro-de-mesa-natal', 'Centro de Mesa Noite Feliz', 'Arranjo baixo com rosas, pinhas e velas para a ceia.', (select id from public.categories where slug = 'natal'), 38900, 8, false, false),
  ('box-natal', 'Flower Box Natal', 'Caixa com rosas vermelhas, eucalipto e ramos de pinheiro.', (select id from public.categories where slug = 'natal'), 27900, 12, false, true)
on conflict (slug) do nothing;
