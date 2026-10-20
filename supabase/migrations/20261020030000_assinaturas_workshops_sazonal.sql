-- Etapa 3: assinaturas (recorrentes e de presente), inscrições pagas em
-- workshops e coleções sazonais.

-- ---------------------------------------------------------------------------
-- Assinaturas: sem exigir conta, com opção de presente
-- ---------------------------------------------------------------------------

alter table public.subscriptions
  alter column profile_id drop not null,
  add column kind text not null default 'recorrente' check (kind in ('recorrente', 'presente')),
  add column gift_months int check (gift_months in (3, 6, 12)),
  add column gift_recipient_name text,
  add column gift_message text,
  add column customer_name text,
  add column customer_email text,
  add column customer_phone text,
  add column customer_cpf text,
  add column delivery_address jsonb,
  add column total_cents int,
  add column mp_preference_id text,
  add column mp_payment_id text,
  add column ends_on date;

alter table public.subscriptions
  add constraint subscriptions_gift_months_required
  check (kind = 'recorrente' or gift_months is not null);

comment on column public.subscriptions.kind is
  'recorrente: cobrança mensal automática (Mercado Pago preapproval). presente: pagamento único de N meses.';

-- ---------------------------------------------------------------------------
-- Workshops: inscrição reservada só por 30 minutos enquanto aguarda pagamento
-- ---------------------------------------------------------------------------

create or replace function public.workshop_availability()
returns table (workshop_id uuid, seats_left int)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.id,
    (w.capacity - coalesce(sum(r.seats) filter (
      where r.status = 'confirmada'
         or (r.status = 'aguardando_pagamento' and r.created_at > now() - interval '30 minutes')
    ), 0))::int
  from public.workshops w
  left join public.workshop_registrations r on r.workshop_id = w.id
  where w.active
  group by w.id;
$$;

-- Reserva vagas de forma atômica. Chamada pelo servidor (service role).
create or replace function public.reserve_workshop_seats(
  p_workshop_id uuid,
  p_seats int,
  p_name text,
  p_email text,
  p_phone text,
  p_cpf text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_left int;
  v_id uuid;
begin
  perform 1 from public.workshops
   where id = p_workshop_id and active and starts_at > now()
   for update;
  if not found then
    raise exception 'Workshop indisponível';
  end if;

  select seats_left into v_left from public.workshop_availability() where workshop_id = p_workshop_id;
  if coalesce(v_left, 0) < p_seats then
    raise exception 'Não há vagas suficientes';
  end if;

  insert into public.workshop_registrations (workshop_id, name, email, phone, cpf, seats)
  values (p_workshop_id, p_name, p_email, p_phone, p_cpf, p_seats)
  returning id into v_id;
  return v_id;
end;
$$;

-- Confirma o pagamento da inscrição. Idempotente.
create or replace function public.confirm_workshop_payment(p_registration_id uuid, p_payment_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.workshop_registrations
     set status = 'confirmada', mp_payment_id = p_payment_id
   where id = p_registration_id and status = 'aguardando_pagamento';
  return found;
end;
$$;

alter table public.workshop_registrations
  add column total_cents int,
  add column mp_preference_id text;

revoke execute on function public.reserve_workshop_seats(uuid, int, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.confirm_workshop_payment(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Coleções sazonais
-- ---------------------------------------------------------------------------

alter table public.categories
  add column seasonal boolean not null default false,
  add column active_from date,
  add column active_until date,
  add column headline text;

comment on column public.categories.seasonal is
  'Coleção sazonal: aparece em destaque na home entre active_from e active_until.';
