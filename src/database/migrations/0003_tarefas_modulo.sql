-- ============================================================
-- MIIRTUS OS - Migração 0003
-- Colunas extras da tabela `tarefas` para o módulo de Tarefas
-- (/dashboard/tarefas): vínculo com produto, observações e agenda.
--
-- Idempotente. Aplique no Supabase (SQL Editor) do projeto
-- rqevfioyoiijvfmtngae ou via:
--   psql "<connection string>" -f este_arquivo.sql
-- ============================================================

alter table tarefas
  add column if not exists produto_id uuid references produtos (id) on delete set null;

alter table tarefas
  add column if not exists observacoes text;

alter table tarefas
  add column if not exists na_agenda boolean not null default false;

alter table tarefas
  add column if not exists agenda_inicio timestamptz;

alter table tarefas
  add column if not exists agenda_fim timestamptz;

create index if not exists idx_tarefas_produto on tarefas (produto_id);

comment on column tarefas.produto_id is 'Produto vinculado à tarefa (contexto).';
comment on column tarefas.observacoes is 'Observações livres da tarefa (separado de descricao).';
comment on column tarefas.na_agenda is 'Se a tarefa também aparece na agenda.';
comment on column tarefas.agenda_inicio is 'Início do bloco de agenda (quando na_agenda = true).';
comment on column tarefas.agenda_fim is 'Fim do bloco de agenda (quando na_agenda = true).';
