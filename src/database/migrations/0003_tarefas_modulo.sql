-- ============================================================
-- MIIRTUS OS - Migração 0003
-- Colunas extras da tabela `tarefas` para o módulo de Tarefas
-- (/dashboard/tarefas): vínculo com produto, observações e agenda.
--
-- Idempotente. Aplique no Supabase (SQL Editor) do projeto
-- rqevfioyoiijvfmtngae ou via:
--   psql "<connection string>" -f este_arquivo.sql
-- ============================================================

alter table tarefas add column if not exists observacoes text;
alter table tarefas add column if not exists produto_id uuid references produtos (id) on delete set null;
alter table tarefas add column if not exists agenda_data date;
alter table tarefas add column if not exists agenda_hora_inicio time;
alter table tarefas add column if not exists agenda_hora_fim time;

create index if not exists idx_tarefas_produto on tarefas (produto_id);

comment on column tarefas.observacoes is 'Observações livres da tarefa (separado de descricao).';
comment on column tarefas.produto_id is 'Produto vinculado à tarefa (contexto).';
comment on column tarefas.agenda_data is 'Data do bloco de agenda (quando a tarefa está na agenda).';
comment on column tarefas.agenda_hora_inicio is 'Hora de início na agenda.';
comment on column tarefas.agenda_hora_fim is 'Hora de fim na agenda.';
