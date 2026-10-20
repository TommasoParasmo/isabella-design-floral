-- Ajustes da revisão da etapa 3.

alter table public.workshop_registrations add column issue text;

-- Confirma a inscrição revalidando a lotação. Uma reserva que passou dos
-- 30 minutos pode ter perdido a vaga para outra pessoa; nesse caso o
-- pagamento fica registrado e a inscrição sinalizada para estorno.
create or replace function public.confirm_workshop_payment(p_registration_id uuid, p_payment_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg record;
  v_capacity int;
  v_taken int;
begin
  select r.id, r.workshop_id, r.seats
    into v_reg
    from public.workshop_registrations r
   where r.id = p_registration_id and r.status = 'aguardando_pagamento';
  if not found then
    return false;
  end if;

  select capacity into v_capacity from public.workshops where id = v_reg.workshop_id for update;

  select coalesce(sum(seats), 0) into v_taken
    from public.workshop_registrations
   where workshop_id = v_reg.workshop_id
     and id <> v_reg.id
     and (status = 'confirmada'
          or (status = 'aguardando_pagamento' and created_at > now() - interval '30 minutes'));

  if v_capacity - v_taken >= v_reg.seats then
    update public.workshop_registrations
       set status = 'confirmada', mp_payment_id = p_payment_id
     where id = v_reg.id;
    return true;
  end if;

  update public.workshop_registrations
     set status = 'cancelada',
         mp_payment_id = p_payment_id,
         issue = 'Pagamento recebido depois que a turma lotou: estornar ou oferecer outra data'
   where id = v_reg.id;
  return false;
end;
$$;

revoke execute on function public.confirm_workshop_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.confirm_workshop_payment(uuid, text) to service_role;
grant execute on function public.reserve_workshop_seats(uuid, int, text, text, text, text) to service_role;
