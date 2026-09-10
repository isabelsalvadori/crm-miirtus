-- ============================================================
-- MIIRTUS OS - Migração 0009
-- Vínculos opcionais da tabela `metas` para o módulo de Metas
-- (/dashboard/metas). Além de `projeto_id` (já existente), a
-- meta pode apontar para um produto ou um evento específico.
-- Quando nenhum id é definido, a meta é "geral" (todos os
-- itens daquele tipo).
--
-- Idempotente. Aplique no Supabase (SQL Editor) do projeto
-- rqevfioyoiijvfmtngae ou via:
--   psql "<connection string>" -f este_arquivo.sql
-- ============================================================

alter table metas
  add column if not exists produto_id uuid references produtos (id) on delete set null;

alter table metas
  add column if not exists evento_id uuid references eventos (id) on delete set null;

comment on column metas.produto_id is 'Produto específico da meta (tipo = produto); nulo = meta geral de produtos.';
comment on column metas.evento_id is 'Evento específico da meta (tipo = evento); nulo = meta geral de eventos.';

create index if not exists idx_metas_produto on metas (produto_id);
create index if not exists idx_metas_evento on metas (evento_id);
