-- Conteúdo enviado pela Isa (novembro/2026): planos de assinatura do PDF
-- "Assinatura Floral 2026" e o Workshop Guirlanda de Natal.

-- ---------------------------------------------------------------------------
-- Assinaturas: buquês ou arranjos em vasos, em 3 tamanhos e 3 frequências
-- ---------------------------------------------------------------------------

alter table public.subscription_plans
  add column kind text check (kind in ('buque', 'arranjo')),
  add column size text check (size in ('pequeno', 'medio', 'grande'));

comment on column public.subscription_plans.kind is 'buque: sem vaso. arranjo: com vaso.';

-- Os planos de exemplo saem do site. Ficam inativos (e não apagados) para
-- preservar assinaturas que apontem para eles.
update public.subscription_plans set active = false where slug in ('essencial', 'jardim', 'atelie');

insert into public.subscription_plans (slug, name, description, frequency, price_cents, image_url, perks, position, kind, size) values
  ('buque-pequeno-mensal', 'Buquê Pequeno · Mensal', '8 a 12 hastes, ideal para vasos menores (20 cm de altura).', 'mensal', 14900, '/fotos/buque-colorido.jpg', array['1 entrega por mês', 'Flores frescas da estação', 'Não inclui vaso', 'Entrega em SP (frete a combinar) ou retirada'], 1, 'buque', 'pequeno'),
  ('buque-medio-mensal', 'Buquê Médio · Mensal', '12 a 15 hastes, ideal para vasos médios (25 cm de altura).', 'mensal', 18900, '/fotos/buque-azul-campo.jpg', array['1 entrega por mês', 'Flores frescas da estação', 'Não inclui vaso', 'Entrega em SP (frete a combinar) ou retirada'], 2, 'buque', 'medio'),
  ('buque-grande-mensal', 'Buquê Grande · Mensal', '18 a 25 hastes, ideal para vasos maiores (30 cm de altura).', 'mensal', 22900, '/fotos/buque-rosas-brancas.jpg', array['1 entrega por mês', 'Flores frescas da estação', 'Não inclui vaso', 'Entrega em SP (frete a combinar) ou retirada'], 3, 'buque', 'grande'),
  ('buque-pequeno-quinzenal', 'Buquê Pequeno · Quinzenal', '8 a 12 hastes, ideal para vasos menores (20 cm de altura).', 'quinzenal', 27900, '/fotos/buque-colorido.jpg', array['2 entregas por mês', 'Flores frescas da estação', 'Não inclui vaso', 'Entrega em SP (frete a combinar) ou retirada'], 4, 'buque', 'pequeno'),
  ('buque-medio-quinzenal', 'Buquê Médio · Quinzenal', '12 a 15 hastes, ideal para vasos médios (25 cm de altura).', 'quinzenal', 35900, '/fotos/buque-azul-campo.jpg', array['2 entregas por mês', 'Flores frescas da estação', 'Não inclui vaso', 'Entrega em SP (frete a combinar) ou retirada'], 5, 'buque', 'medio'),
  ('buque-grande-quinzenal', 'Buquê Grande · Quinzenal', '18 a 25 hastes, ideal para vasos maiores (30 cm de altura).', 'quinzenal', 43900, '/fotos/buque-rosas-brancas.jpg', array['2 entregas por mês', 'Flores frescas da estação', 'Não inclui vaso', 'Entrega em SP (frete a combinar) ou retirada'], 6, 'buque', 'grande'),
  ('buque-pequeno-semanal', 'Buquê Pequeno · Semanal', '8 a 12 hastes, ideal para vasos menores (20 cm de altura).', 'semanal', 46900, '/fotos/buque-colorido.jpg', array['4 entregas por mês', 'Flores frescas da estação', 'Não inclui vaso', 'Entrega em SP (frete a combinar) ou retirada'], 7, 'buque', 'pequeno'),
  ('buque-medio-semanal', 'Buquê Médio · Semanal', '12 a 15 hastes, ideal para vasos médios (25 cm de altura).', 'semanal', 57900, '/fotos/buque-azul-campo.jpg', array['4 entregas por mês', 'Flores frescas da estação', 'Não inclui vaso', 'Entrega em SP (frete a combinar) ou retirada'], 8, 'buque', 'medio'),
  ('buque-grande-semanal', 'Buquê Grande · Semanal', '18 a 25 hastes, ideal para vasos maiores (30 cm de altura).', 'semanal', 72900, '/fotos/buque-rosas-brancas.jpg', array['4 entregas por mês', 'Flores frescas da estação', 'Não inclui vaso', 'Entrega em SP (frete a combinar) ou retirada'], 9, 'buque', 'grande'),
  ('arranjo-pequeno-mensal', 'Arranjo Pequeno · Mensal', '8 a 12 hastes, ideal para vasos menores (20 cm de altura).', 'mensal', 18900, '/fotos/arranjo-vaso-ceramica.jpg', array['1 entrega por mês', 'Flores frescas da estação', 'Vaso incluso', 'Entrega em SP (frete a combinar) ou retirada'], 10, 'arranjo', 'pequeno'),
  ('arranjo-medio-mensal', 'Arranjo Médio · Mensal', '12 a 15 hastes, ideal para vasos médios (25 cm de altura).', 'mensal', 22900, '/fotos/arranjo-vaso-vidro.jpg', array['1 entrega por mês', 'Flores frescas da estação', 'Vaso incluso', 'Entrega em SP (frete a combinar) ou retirada'], 11, 'arranjo', 'medio'),
  ('arranjo-grande-mensal', 'Arranjo Grande · Mensal', '18 a 25 hastes, ideal para vasos maiores (30 cm de altura).', 'mensal', 26900, '/fotos/arranjo-caixa-rosas.jpg', array['1 entrega por mês', 'Flores frescas da estação', 'Vaso incluso', 'Entrega em SP (frete a combinar) ou retirada'], 12, 'arranjo', 'grande'),
  ('arranjo-pequeno-quinzenal', 'Arranjo Pequeno · Quinzenal', '8 a 12 hastes, ideal para vasos menores (20 cm de altura).', 'quinzenal', 35900, '/fotos/arranjo-vaso-ceramica.jpg', array['2 entregas por mês', 'Flores frescas da estação', 'Vaso incluso', 'Entrega em SP (frete a combinar) ou retirada'], 13, 'arranjo', 'pequeno'),
  ('arranjo-medio-quinzenal', 'Arranjo Médio · Quinzenal', '12 a 15 hastes, ideal para vasos médios (25 cm de altura).', 'quinzenal', 43900, '/fotos/arranjo-vaso-vidro.jpg', array['2 entregas por mês', 'Flores frescas da estação', 'Vaso incluso', 'Entrega em SP (frete a combinar) ou retirada'], 14, 'arranjo', 'medio'),
  ('arranjo-grande-quinzenal', 'Arranjo Grande · Quinzenal', '18 a 25 hastes, ideal para vasos maiores (30 cm de altura).', 'quinzenal', 51900, '/fotos/arranjo-caixa-rosas.jpg', array['2 entregas por mês', 'Flores frescas da estação', 'Vaso incluso', 'Entrega em SP (frete a combinar) ou retirada'], 15, 'arranjo', 'grande'),
  ('arranjo-pequeno-semanal', 'Arranjo Pequeno · Semanal', '8 a 12 hastes, ideal para vasos menores (20 cm de altura).', 'semanal', 56900, '/fotos/arranjo-vaso-ceramica.jpg', array['4 entregas por mês', 'Flores frescas da estação', 'Vaso incluso', 'Entrega em SP (frete a combinar) ou retirada'], 16, 'arranjo', 'pequeno'),
  ('arranjo-medio-semanal', 'Arranjo Médio · Semanal', '12 a 15 hastes, ideal para vasos médios (25 cm de altura).', 'semanal', 67900, '/fotos/arranjo-vaso-vidro.jpg', array['4 entregas por mês', 'Flores frescas da estação', 'Vaso incluso', 'Entrega em SP (frete a combinar) ou retirada'], 17, 'arranjo', 'medio'),
  ('arranjo-grande-semanal', 'Arranjo Grande · Semanal', '18 a 25 hastes, ideal para vasos maiores (30 cm de altura).', 'semanal', 82900, '/fotos/arranjo-caixa-rosas.jpg', array['4 entregas por mês', 'Flores frescas da estação', 'Vaso incluso', 'Entrega em SP (frete a combinar) ou retirada'], 18, 'arranjo', 'grande')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  frequency = excluded.frequency,
  price_cents = excluded.price_cents,
  image_url = excluded.image_url,
  perks = excluded.perks,
  position = excluded.position,
  kind = excluded.kind,
  size = excluded.size,
  active = true;

-- ---------------------------------------------------------------------------
-- Workshop Guirlanda de Natal: duas turmas (sábado 21/11 e domingo 29/11)
-- ---------------------------------------------------------------------------

-- Turmas de exemplo saem do site (inativas, sem apagar inscrições).
update public.workshops set active = false where slug in ('buque-de-noiva', 'arranjos-de-natal');

insert into public.workshops (slug, title, description, starts_at, duration_minutes, price_cents, capacity, includes, image_url) values
  ('guirlanda-de-natal-21-11', 'Guirlanda de Natal', 'Vamos aprender a montar uma guirlanda de Natal com flores naturais, com uma pausa para o coffee break. No final, você leva a sua guirlanda para casa.', '2026-11-21 10:00-03', 180, 38000, 10, array['Todos os materiais', 'Coffee break', 'Sua guirlanda para levar para casa'], '/fotos/workshop-guirlanda-natal.jpg'),
  ('guirlanda-de-natal-29-11', 'Guirlanda de Natal', 'Vamos aprender a montar uma guirlanda de Natal com flores naturais, com uma pausa para o coffee break. No final, você leva a sua guirlanda para casa.', '2026-11-29 10:00-03', 180, 38000, 10, array['Todos os materiais', 'Coffee break', 'Sua guirlanda para levar para casa'], '/fotos/workshop-guirlanda-natal.jpg')
on conflict (slug) do nothing;
