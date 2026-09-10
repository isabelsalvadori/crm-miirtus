-- ============================================================
-- MIIRTUS OS - Migração 0008
-- Campo `tipo_formato` da tabela `eventos` para o módulo de
-- Eventos (/dashboard/eventos): distingue eventos únicos
-- (uma data só) de eventos com várias edições.
--
--   'unico'   -> evento com data única; ao criar, uma edição
--                única é gerada automaticamente com os dados.
--   'edicoes' -> evento recorrente; edições criadas à parte.
--
-- Idempotente. Aplique no Supabase (SQL Editor) do projeto
-- rqevfioyoiijvfmtngae ou via:
--   psql "<connection string>" -f este_arquivo.sql
-- ============================================================

alter table eventos
  add column if not exists tipo_formato text default 'edicoes';

comment on column eventos.tipo_formato is 'Formato do evento: unico (data única, edição gerada automaticamente) | edicoes (recorrente, edições à parte).';
