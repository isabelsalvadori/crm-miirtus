-- ============================================================
-- MIIRTUS OS - Migração 0011
-- Campos extras da tabela `documentos` para o módulo de
-- Biblioteca (/dashboard/biblioteca):
--   Produtos · Estudos · Acervo
--
-- Os documentos da Biblioteca usam `entidade_tipo` para separar
-- os três acervos:
--   'biblioteca_produto' | 'biblioteca_estudo' | 'biblioteca_acervo'
--
-- Só adiciona colunas — nada é renomeado nem removido.
-- Idempotente. Aplique no Supabase (SQL Editor) do projeto
-- rqevfioyoiijvfmtngae ou via:
--   psql "<connection string>" -f este_arquivo.sql
-- ============================================================

alter table documentos
  add column if not exists produto_id uuid references produtos (id) on delete set null;

alter table documentos
  add column if not exists fonte text;

alter table documentos
  add column if not exists resumo text;

alter table documentos
  add column if not exists anotacoes text;

alter table documentos
  add column if not exists aplicacoes text;

comment on column documentos.produto_id is 'Produto relacionado ao documento (opcional).';
comment on column documentos.fonte is 'Fonte / autor do estudo (Biblioteca › Estudos).';
comment on column documentos.resumo is 'Resumo do estudo (Biblioteca › Estudos).';
comment on column documentos.anotacoes is 'Anotações pessoais sobre o estudo.';
comment on column documentos.aplicacoes is 'Possíveis aplicações na MIIRTUS.';

create index if not exists idx_documentos_produto on documentos (produto_id);
create index if not exists idx_documentos_entidade
  on documentos (entidade_tipo, arquivado_em);
