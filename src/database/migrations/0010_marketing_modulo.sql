-- ============================================================
-- MIIRTUS OS - Migração 0010
-- Colunas do módulo de Marketing (/dashboard/marketing):
--   Conteúdo · Calendário · Campanhas · Ações Orgânicas
--
-- Ajusta as tabelas `conteudos`, `campanhas` e `acoes_organicas`
-- para o modelo usado pelo módulo. Só adiciona colunas — nada é
-- renomeado nem removido; as colunas antigas continuam existindo.
--
-- Idempotente. Aplique no Supabase (SQL Editor) do projeto
-- rqevfioyoiijvfmtngae ou via:
--   psql "<connection string>" -f este_arquivo.sql
-- ============================================================

-- ------------------------------------------------------------
-- conteudos
-- ------------------------------------------------------------
alter table conteudos
  add column if not exists corpo_roteiro text;

alter table conteudos
  add column if not exists campanha_id uuid references campanhas (id) on delete set null;

-- Migra o conteúdo do campo legado `corpo` para `corpo_roteiro`.
update conteudos
  set corpo_roteiro = corpo
  where corpo_roteiro is null and corpo is not null;

comment on column conteudos.corpo_roteiro is 'Corpo / roteiro / copy da peça de conteúdo.';
comment on column conteudos.campanha_id is 'Campanha de marketing relacionada (opcional).';

create index if not exists idx_conteudos_campanha on conteudos (campanha_id);
create index if not exists idx_conteudos_data_agendada on conteudos (data_agendada);

-- ------------------------------------------------------------
-- campanhas
-- ------------------------------------------------------------
alter table campanhas
  add column if not exists canal_principal text;

alter table campanhas
  add column if not exists orcamento_planejado numeric(14,2);

alter table campanhas
  add column if not exists gasto_real numeric(14,2);

alter table campanhas
  add column if not exists receita_gerada numeric(14,2);

alter table campanhas
  add column if not exists leads integer;

alter table campanhas
  add column if not exists vendas integer;

alter table campanhas
  add column if not exists produto_id uuid references produtos (id) on delete set null;

alter table campanhas
  add column if not exists evento_id uuid references eventos (id) on delete set null;

alter table campanhas
  add column if not exists periodo_inicio date;

alter table campanhas
  add column if not exists periodo_fim date;

-- Preenche os campos novos a partir dos legados equivalentes.
update campanhas set canal_principal    = canal               where canal_principal    is null and canal               is not null;
update campanhas set orcamento_planejado = orcamento_previsto  where orcamento_planejado is null and orcamento_previsto  is not null;
update campanhas set gasto_real          = orcamento_realizado where gasto_real          is null and orcamento_realizado is not null;
update campanhas set periodo_inicio      = data_inicio         where periodo_inicio      is null and data_inicio         is not null;
update campanhas set periodo_fim         = data_fim            where periodo_fim         is null and data_fim            is not null;

comment on column campanhas.canal_principal is 'Canal principal da campanha (instagram, youtube, ...).';
comment on column campanhas.orcamento_planejado is 'Orçamento planejado (R$).';
comment on column campanhas.gasto_real is 'Gasto real acumulado (R$).';
comment on column campanhas.receita_gerada is 'Receita atribuída à campanha (R$). Base do ROAS.';
comment on column campanhas.leads is 'Leads gerados pela campanha.';
comment on column campanhas.vendas is 'Vendas atribuídas à campanha. Base do CAC.';
comment on column campanhas.produto_id is 'Produto relacionado (opcional).';
comment on column campanhas.evento_id is 'Evento relacionado (opcional).';
comment on column campanhas.periodo_inicio is 'Início do período da campanha.';
comment on column campanhas.periodo_fim is 'Fim do período da campanha.';

create index if not exists idx_campanhas_produto on campanhas (produto_id);
create index if not exists idx_campanhas_evento on campanhas (evento_id);

-- ------------------------------------------------------------
-- acoes_organicas
-- ------------------------------------------------------------
alter table acoes_organicas
  add column if not exists canal_local text;

alter table acoes_organicas
  add column if not exists data date;

alter table acoes_organicas
  add column if not exists status text;

alter table acoes_organicas
  add column if not exists custo numeric(14,2);

alter table acoes_organicas
  add column if not exists contatos_gerados integer;

alter table acoes_organicas
  add column if not exists cliques integer;

alter table acoes_organicas
  add column if not exists inscricoes integer;

alter table acoes_organicas
  add column if not exists leads integer;

alter table acoes_organicas
  add column if not exists vendas integer;

alter table acoes_organicas
  add column if not exists receita_atribuida numeric(14,2);

alter table acoes_organicas
  add column if not exists produto_id uuid references produtos (id) on delete set null;

alter table acoes_organicas
  add column if not exists projeto_id uuid references projetos (id) on delete set null;

alter table acoes_organicas
  add column if not exists evento_id uuid references eventos (id) on delete set null;

alter table acoes_organicas
  add column if not exists campanha_id uuid references campanhas (id) on delete set null;

update acoes_organicas set data = coalesce(data_executada, data_prevista)
  where data is null and (data_executada is not null or data_prevista is not null);

comment on column acoes_organicas.canal_local is 'Canal ou local onde a ação acontece.';
comment on column acoes_organicas.data is 'Data da ação orgânica.';
comment on column acoes_organicas.status is 'planejada | ativa | encerrada.';
comment on column acoes_organicas.custo is 'Custo da ação (R$), quando houver.';
comment on column acoes_organicas.receita_atribuida is 'Receita atribuída à ação (R$).';

create index if not exists idx_acoes_organicas_produto on acoes_organicas (produto_id);
create index if not exists idx_acoes_organicas_projeto on acoes_organicas (projeto_id);
create index if not exists idx_acoes_organicas_evento on acoes_organicas (evento_id);
create index if not exists idx_acoes_organicas_campanha on acoes_organicas (campanha_id);
