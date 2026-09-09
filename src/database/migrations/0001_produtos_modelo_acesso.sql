-- ============================================================
-- MIIRTUS OS - Migração 0001
-- Adiciona a coluna `modelo_acesso` à tabela `produtos`,
-- necessária para o módulo de Produtos (/dashboard/produtos).
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- ============================================================

alter table produtos
  add column if not exists modelo_acesso text;

comment on column produtos.modelo_acesso is
  'Modelo de acesso do produto: pago | gratuito | assinatura | incluso | interno | outro';
