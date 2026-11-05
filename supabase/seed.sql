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

-- Os planos de assinatura e os workshops são criados pela migração
-- 20261105010000_conteudo_isa, com os valores enviados pela Isa.

-- Coleção sazonal de Natal (aparece na home de 1/11 a 25/12)
insert into public.categories (slug, name, description, position, seasonal, active_from, active_until, headline) values
  ('natal', 'Natal', 'Guirlandas, centros de mesa e arranjos para as festas.', 0, true, '2026-11-01', '2026-12-25', 'Coleção de Natal')
on conflict (slug) do nothing;

