-- ============================================================
-- MIIRTUS OS - Migração 0007
-- Campos extras de `edicoes_evento` para o módulo de Eventos
-- (/dashboard/eventos): modelo de acesso, preço, projeto
-- relacionado e resumo da edição.
--
-- Idempotente. Aplique no Supabase (SQL Editor) do projeto
-- rqevfioyoiijvfmtngae ou via:
--   psql "<connection string>" -f este_arquivo.sql
-- ============================================================

alter table edicoes_evento
  add column if not exists modelo_acesso text;
alter table edicoes_evento
  add column if not exists preco numeric(12,2);
alter table edicoes_evento
  add column if not exists projeto_id uuid references projetos (id) on delete set null;
alter table edicoes_evento
  add column if not exists resumo text;

create index if not exists idx_edicoes_evento_projeto
  on edicoes_evento (projeto_id);

comment on column edicoes_evento.modelo_acesso is 'Modelo de acesso da edição: gratuito | pago';
comment on column edicoes_evento.preco is 'Preço da edição quando modelo_acesso = pago.';
comment on column edicoes_evento.projeto_id is 'Projeto relacionado à edição (contexto).';
comment on column edicoes_evento.resumo is 'Resumo / descrição curta da edição.';
