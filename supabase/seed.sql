-- Dados iniciais de exemplo. A Isa troca nomes, preços e fotos pelo painel.

insert into public.categories (slug, name, description, position) values
  ('buques', 'Buquês', 'Buquês assinados, montados à mão no dia da entrega.', 1),
  ('arranjos', 'Arranjos', 'Arranjos em vasos e cachepôs para mesa e decoração.', 2),
  ('box', 'Flower Box', 'Caixas com flores frescas, prontas para presentear.', 3),
  ('presentes', 'Presentes', 'Complementos para acompanhar as flores.', 4)
on conflict (slug) do nothing;

insert into public.products (slug, name, description, category_id, price_cents, stock, featured) values
  ('buque-bordo', 'Buquê Bordô', 'Rosas colombianas em tons de vinho com folhagens de eucalipto.', (select id from public.categories where slug = 'buques'), 28900, 8, true),
  ('buque-rose-antique', 'Buquê Rosé Antique', 'Rosas cor de chá, lisianthus e astilbe em papel de seda.', (select id from public.categories where slug = 'buques'), 24900, 10, true),
  ('buque-campestre', 'Buquê Campestre', 'Mix de flores da estação com toque silvestre.', (select id from public.categories where slug = 'buques'), 18900, 12, false),
  ('arranjo-jardim-ingles', 'Arranjo Jardim Inglês', 'Peônias, rosas spray e hortênsias em vaso de cerâmica.', (select id from public.categories where slug = 'arranjos'), 34900, 5, true),
  ('arranjo-orquidea', 'Orquídea Phalaenopsis', 'Orquídea dupla em cachepô de cimento queimado.', (select id from public.categories where slug = 'arranjos'), 21900, 6, false),
  ('box-paixao', 'Flower Box Paixão', 'Caixa redonda com 12 rosas vermelhas.', (select id from public.categories where slug = 'box'), 26900, 7, true),
  ('box-delicada', 'Flower Box Delicada', 'Caixa com rosas rosé, mini rosas e gipsófila.', (select id from public.categories where slug = 'box'), 22900, 9, false),
  ('vela-aromatica', 'Vela Aromática Flor de Figo', 'Vela de soja 180g para acompanhar o presente.', (select id from public.categories where slug = 'presentes'), 7900, 15, false)
on conflict (slug) do nothing;

insert into public.delivery_slots (label, starts_at, ends_at, fee_cents, max_orders) values
  ('Manhã (9h às 12h)', '09:00', '12:00', 2500, 10),
  ('Tarde (13h às 17h)', '13:00', '17:00', 2500, 10),
  ('Noite (18h às 20h)', '18:00', '20:00', 3500, 6);

insert into public.subscription_plans (slug, name, description, frequency, price_cents, perks, position) values
  ('essencial', 'Essencial', 'Um arranjo fresco por mês para deixar a casa mais viva.', 'mensal', 14900, array['1 arranjo por mês', 'Flores da estação', 'Entrega grátis em SP'], 1),
  ('jardim', 'Jardim', 'Flores a cada 15 dias, com curadoria da Isa.', 'quinzenal', 26900, array['2 arranjos por mês', 'Curadoria exclusiva', 'Entrega grátis em SP', '10% off na loja'], 2),
  ('atelie', 'Ateliê', 'Toda semana um arranjo novo, para casa ou escritório.', 'semanal', 49900, array['4 arranjos por mês', 'Vaso de presente na adesão', 'Entrega grátis em SP', '15% off em workshops'], 3)
on conflict (slug) do nothing;

insert into public.workshops (slug, title, description, starts_at, duration_minutes, price_cents, capacity, includes) values
  ('buque-de-noiva', 'Buquê de Noiva', 'Aprenda a técnica espiral e monte seu próprio buquê com flores nobres.', '2026-11-14 14:00-03', 180, 39000, 10, array['Todas as flores e materiais', 'Café da tarde', 'Certificado']),
  ('arranjos-de-natal', 'Arranjos de Natal', 'Guirlanda e centro de mesa natalino com folhagens e flores secas.', '2026-12-05 10:00-03', 240, 45000, 12, array['Todos os materiais', 'Brunch', 'Peças para levar para casa'])
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
