-- Notas fiscais (Focus NFe). A Isa é MEI: NF-e para vendas de produto
-- quando o cliente pede e NFS-e Nacional para os workshops.

alter table public.fiscal_documents
  add column recipient jsonb,
  add column provider_response jsonb;

create index fiscal_documents_order_idx on public.fiscal_documents (order_id);
create index fiscal_documents_registration_idx on public.fiscal_documents (workshop_registration_id);

-- Numeração da DPS (NFS-e Nacional): cada nota precisa de um número novo.
create sequence public.nfse_dps_number_seq start 1;
revoke all on sequence public.nfse_dps_number_seq from public, anon, authenticated;

create or replace function public.next_dps_number()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Somente administradoras';
  end if;
  return nextval('public.nfse_dps_number_seq');
end;
$$;

revoke execute on function public.next_dps_number() from public, anon;
grant execute on function public.next_dps_number() to authenticated;
