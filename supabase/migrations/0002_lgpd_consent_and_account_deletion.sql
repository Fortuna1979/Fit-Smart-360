-- LGPD: registra quando o usuário consentiu o uso de dados sensíveis de saúde
alter table public.user_data
  add column health_data_consent_at timestamptz;

-- LGPD: permite que o próprio usuário exclua a conta e todos os seus dados.
-- A função roda com privilégio elevado (security definer) só para conseguir
-- apagar a linha em auth.users; o "where id = auth.uid()" garante que cada
-- usuário só pode excluir a própria conta. As tabelas user_data,
-- scanned_equipments, workout_plans e workout_progress têm
-- "on delete cascade" e são apagadas automaticamente.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
