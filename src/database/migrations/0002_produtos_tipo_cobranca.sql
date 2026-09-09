-- ============================================================
-- MIIRTUS OS - Migração 0002
-- Colunas do módulo de Produtos (/dashboard/produtos).
--
-- Auto-suficiente: recria a coluna da migração 0001 (modelo_acesso)
-- e adiciona tipo_cobranca. Idempotente — pode rodar mais de uma vez.
--
-- Aplique no Supabase (SQL Editor) do projeto rqevfioyoiijvfmtngae
-- ou via: psql "<connection string>" -f este_arquivo.sql
-- ============================================================

alter table produtos
  add column if not exists modelo_acesso text;

alter table produtos
  add column if not exists tipo_cobranca text;

comment on column produtos.modelo_acesso is
  'Modelo de acesso: pago | gratuito | assinatura | incluso | interno | outro';

comment on column produtos.tipo_cobranca is
  'Tipo de cobrança (quando pago/assinatura): unico | recorrente_mensal | recorrente_anual | outro';
