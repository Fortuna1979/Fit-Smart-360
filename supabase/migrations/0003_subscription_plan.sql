-- Adiciona o plano de assinatura do usuário (gratuito por padrão)
alter table public.user_data
  add column subscription_plan text not null default 'free'
  check (subscription_plan in ('free', 'basic', 'premium'));
