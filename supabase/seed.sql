-- Dados iniciais de exemplo. A Isa troca nomes, preços e fotos pelo painel.

insert into public.categories (slug, name, description, position) values
  ('buques', 'Buquês', 'Buquês assinados, montados à mão no dia da entrega.', 1),
  ('arranjos', 'Arranjos', 'Arranjos em vasos para mesa, casa e recepções.', 2)
on conflict (slug) do nothing;

-- Os buquês (pequeno, médio, grande) e as flores são criados pela migração
-- 20261105000000_buques_por_tamanho. Aqui só ligamos os buquês à categoria.
update public.products set category_id = (select id from public.categories where slug = 'buques')
 where flower_count is not null and category_id is null;

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

