-- ============================================================
-- MIIRTUS OS - Migração 0006
-- Colunas de vínculo e agenda em `tarefas`, usadas pela gestão
-- completa de tarefas no painel Hoje (/dashboard/hoje).
--
-- Reinclui as colunas da migração 0003 (agenda + produto_id +
-- observacoes) e adiciona vínculos com evento, cliente, ideia e
-- campanha. Idempotente — pode rodar mais de uma vez.
--
-- Aplique no Supabase (SQL Editor) do projeto rqevfioyoiijvfmtngae
-- ou via: psql "<connection string>" -f este_arquivo.sql
-- ============================================================

alter table tarefas add column if not exists observacoes text;
alter table tarefas add column if not exists agenda_data date;
alter table tarefas add column if not exists agenda_hora_inicio time;
alter table tarefas add column if not exists agenda_hora_fim time;

alter table tarefas add column if not exists produto_id uuid references produtos (id) on delete set null;
alter table tarefas add column if not exists evento_id uuid references eventos (id) on delete set null;
alter table tarefas add column if not exists cliente_id uuid references pessoas (id) on delete set null;
alter table tarefas add column if not exists ideia_id uuid references ideias (id) on delete set null;
alter table tarefas add column if not exists campanha_id uuid references campanhas (id) on delete set null;

create index if not exists idx_tarefas_produto on tarefas (produto_id);
create index if not exists idx_tarefas_evento on tarefas (evento_id);
create index if not exists idx_tarefas_cliente on tarefas (cliente_id);
create index if not exists idx_tarefas_ideia on tarefas (ideia_id);
create index if not exists idx_tarefas_campanha on tarefas (campanha_id);

comment on column tarefas.evento_id is 'Evento vinculado à tarefa (contexto).';
comment on column tarefas.cliente_id is 'Pessoa/cliente vinculada à tarefa (contexto).';
comment on column tarefas.ideia_id is 'Ideia que originou ou se relaciona à tarefa.';
comment on column tarefas.campanha_id is 'Campanha vinculada à tarefa (contexto).';
