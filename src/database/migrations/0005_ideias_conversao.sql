-- ============================================================
-- MIIRTUS OS - Migração 0005
-- Rastreio de conversão de ideias em outras entidades
-- (/dashboard/ideias → Projeto | Produto | Evento | Conteúdo).
--
-- Mesmo padrão de `capturas_rapidas`: a ideia original é
-- preservada e apenas anota o que originou.
--
-- Idempotente. Aplique no Supabase (SQL Editor) do projeto
-- rqevfioyoiijvfmtngae ou via:
--   psql "<connection string>" -f este_arquivo.sql
-- ============================================================

alter table ideias add column if not exists convertida_em_tipo text;
alter table ideias add column if not exists convertida_em_id uuid;

create index if not exists idx_ideias_convertida
  on ideias (convertida_em_tipo, convertida_em_id);

comment on column ideias.convertida_em_tipo is
  'Entidade originada a partir da ideia: projeto | produto | evento | conteudo';
comment on column ideias.convertida_em_id is
  'ID do registro criado na conversão (na tabela correspondente ao tipo).';
