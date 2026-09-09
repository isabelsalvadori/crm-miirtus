-- ============================================================
-- MIIRTUS OS - Schema completo (v1)
-- Postgres 15 / Supabase
-- gen_random_uuid() disponivel no core do Postgres 15
-- RLS NAO ativado nesta etapa
-- ============================================================

begin;

-- ============================================================
-- 1. tags
-- ============================================================
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text,
  cor text,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table tags is 'Rotulos livres reutilizaveis para classificar qualquer entidade do sistema.';

-- ============================================================
-- 2. categorias_financeiras
-- ============================================================
create table if not exists categorias_financeiras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  -- tipo: 'receita' | 'despesa'
  tipo text,
  cor text,
  descricao text,
  parent_id uuid references categorias_financeiras (id) on delete set null,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table categorias_financeiras is 'Plano de contas hierarquico para classificar movimentacoes e orcamentos.';

-- ============================================================
-- 3. pessoas
-- ============================================================
create table if not exists pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  -- tipo: 'cliente' | 'lead' | 'fornecedor' | 'parceiro' | 'colaborador'
  tipo text,
  email text,
  telefone text,
  -- documento: CPF/CNPJ
  documento text,
  empresa text,
  cargo text,
  origem text,
  data_nascimento date,
  endereco jsonb,
  redes_sociais jsonb,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table pessoas is 'Cadastro unificado de contatos: clientes, leads, fornecedores, parceiros e colaboradores.';

-- ============================================================
-- 4. produtos
-- ============================================================
create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text,
  -- tipo: 'curso' | 'mentoria' | 'servico' | 'infoproduto' | 'fisico' | 'outro'
  tipo text,
  -- status: 'rascunho' | 'ativo' | 'pausado' | 'encerrado'
  status text,
  descricao text,
  -- modelo_acesso: 'pago' | 'gratuito' | 'assinatura' | 'incluso' | 'interno' | 'outro'
  modelo_acesso text,
  -- tipo_cobranca (quando pago/assinatura): 'unico' | 'recorrente_mensal' | 'recorrente_anual' | 'outro'
  tipo_cobranca text,
  preco numeric(12,2),
  moeda text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table produtos is 'Ofertas comercializaveis: cursos, mentorias, servicos e produtos fisicos.';

-- ============================================================
-- 5. versoes_produto
-- ============================================================
create table if not exists versoes_produto (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos (id) on delete cascade,
  versao text not null,
  nome text,
  status text,
  preco numeric(12,2),
  notas_versao text,
  data_lancamento date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table versoes_produto is 'Iteracoes de um produto ao longo do tempo (turmas, releases, edicoes comerciais).';

-- ============================================================
-- 6. projetos
-- ============================================================
create table if not exists projetos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text,
  -- status: 'planejamento' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado'
  status text,
  -- prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  prioridade text,
  descricao text,
  responsavel_id uuid references pessoas (id) on delete set null,
  progresso integer not null default 0 check (progresso between 0 and 100),
  data_inicio date,
  data_fim_prevista date,
  data_fim_real date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table projetos is 'Iniciativas com escopo, prazo e responsavel - unidade central de organizacao do trabalho.';

-- ============================================================
-- 7. fases_projeto
-- ============================================================
create table if not exists fases_projeto (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id) on delete cascade,
  nome text not null,
  descricao text,
  status text,
  ordem integer not null default 0,
  data_inicio date,
  data_fim_prevista date,
  data_fim_real date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table fases_projeto is 'Etapas sequenciais de um projeto para agrupar tarefas e marcar progresso.';

-- ============================================================
-- 8. eventos
-- ============================================================
create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text,
  -- tipo: 'workshop' | 'palestra' | 'lancamento' | 'live' | 'webinar' | 'presencial'
  tipo text,
  status text,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table eventos is 'Conceito recorrente de evento (a "marca" do evento), independente de datas.';

-- ============================================================
-- 9. edicoes_evento
-- ============================================================
create table if not exists edicoes_evento (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos (id) on delete cascade,
  nome text,
  numero integer,
  status text,
  -- formato: 'online' | 'presencial' | 'hibrido'
  formato text,
  local text,
  link_transmissao text,
  capacidade integer,
  vagas_preenchidas integer not null default 0,
  data_inicio timestamptz,
  data_fim timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table edicoes_evento is 'Realizacao concreta de um evento em datas especificas (1a edicao, 2a edicao, etc.).';

-- ============================================================
-- 10. tarefas (auto-referencia para subtarefas)
-- ============================================================
create table if not exists tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  observacoes text,
  -- status: 'a_fazer' | 'em_andamento' | 'aguardando' | 'concluida'
  status text,
  -- prioridade: 'baixa' | 'normal' | 'alta' | 'urgente'
  prioridade text,
  parent_id uuid references tarefas (id) on delete cascade,
  projeto_id uuid references projetos (id) on delete set null,
  produto_id uuid references produtos (id) on delete set null,
  fase_id uuid references fases_projeto (id) on delete set null,
  responsavel_id uuid references pessoas (id) on delete set null,
  na_agenda boolean not null default false,
  agenda_inicio timestamptz,
  agenda_fim timestamptz,
  ordem integer not null default 0,
  estimativa_horas numeric(6,2),
  data_prazo timestamptz,
  data_conclusao timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table tarefas is 'Unidades de trabalho acionaveis; parent_id permite hierarquia de subtarefas.';

-- ============================================================
-- 11. ideias
-- ============================================================
create table if not exists ideias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  -- status: 'nova' | 'em_analise' | 'aprovada' | 'descartada' | 'implementada'
  status text,
  categoria text,
  -- impacto: 'baixo' | 'medio' | 'alto'
  impacto text,
  -- esforco: 'baixo' | 'medio' | 'alto'
  esforco text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table ideias is 'Backlog de ideias e oportunidades para avaliacao e priorizacao.';

-- ============================================================
-- 12. notas
-- ============================================================
create table if not exists notas (
  id uuid primary key default gen_random_uuid(),
  titulo text,
  conteudo text,
  -- entidade_tipo: entidade a qual a nota esta vinculada (polimorfico)
  entidade_tipo text,
  entidade_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table notas is 'Anotacoes de formato livre, opcionalmente ancoradas a qualquer entidade.';

-- ============================================================
-- 13. capturas_rapidas
-- ============================================================
create table if not exists capturas_rapidas (
  id uuid primary key default gen_random_uuid(),
  conteudo text not null,
  -- tipo: 'nota' | 'tarefa' | 'ideia' | 'link'
  tipo text,
  processada boolean not null default false,
  convertida_em_tipo text,
  convertida_em_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table capturas_rapidas is 'Inbox de captura instantanea; itens sao triados e convertidos em notas, tarefas ou ideias.';

-- ============================================================
-- 14. conteudos
-- ============================================================
create table if not exists conteudos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  -- tipo: 'post' | 'reel' | 'artigo' | 'video' | 'email' | 'carrossel' | 'story'
  tipo text,
  -- canal: 'instagram' | 'youtube' | 'blog' | 'newsletter' | 'tiktok' | 'linkedin'
  canal text,
  -- status: 'ideia' | 'producao' | 'revisao' | 'agendado' | 'publicado'
  status text,
  pilar text,
  resumo text,
  corpo text,
  produto_id uuid references produtos (id) on delete set null,
  projeto_id uuid references projetos (id) on delete set null,
  responsavel_id uuid references pessoas (id) on delete set null,
  data_agendada timestamptz,
  data_publicacao timestamptz,
  link_publicado text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table conteudos is 'Pecas de conteudo editorial e de marketing em qualquer canal.';

-- ============================================================
-- 15. versoes_conteudo
-- ============================================================
create table if not exists versoes_conteudo (
  id uuid primary key default gen_random_uuid(),
  conteudo_id uuid not null references conteudos (id) on delete cascade,
  versao integer not null,
  corpo text,
  notas text,
  autor_id uuid references pessoas (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table versoes_conteudo is 'Historico de revisoes do corpo de um conteudo.';

-- ============================================================
-- 16. campanhas
-- ============================================================
create table if not exists campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text,
  -- tipo: 'lancamento' | 'perpetuo' | 'trafego' | 'nutricao' | 'evento'
  tipo text,
  status text,
  objetivo text,
  canal text,
  orcamento_previsto numeric(12,2),
  orcamento_realizado numeric(12,2),
  projeto_id uuid references projetos (id) on delete set null,
  data_inicio date,
  data_fim date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table campanhas is 'Esforcos coordenados de marketing/vendas com periodo, objetivo e orcamento.';

-- ============================================================
-- 17. acoes_organicas
-- ============================================================
create table if not exists acoes_organicas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  tipo text,
  status text,
  canal text,
  campanha_id uuid references campanhas (id) on delete set null,
  conteudo_id uuid references conteudos (id) on delete set null,
  responsavel_id uuid references pessoas (id) on delete set null,
  data_prevista date,
  data_executada date,
  resultado text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table acoes_organicas is 'Acoes de alcance organico (parcerias, colabs, participacoes) ligadas a campanhas ou conteudos.';

-- ============================================================
-- 18. parcelamentos
-- ============================================================
create table if not exists parcelamentos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  -- tipo: 'a_pagar' | 'a_receber'
  tipo text,
  status text,
  valor_total numeric(12,2) not null,
  numero_parcelas integer not null,
  valor_parcela numeric(12,2),
  periodicidade text not null default 'mensal',
  data_primeira_parcela date,
  pessoa_id uuid references pessoas (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table parcelamentos is 'Acordos de pagamento/recebimento divididos em parcelas; gera movimentacoes financeiras.';

-- ============================================================
-- 19. movimentacoes_financeiras
-- ============================================================
create table if not exists movimentacoes_financeiras (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  -- tipo: 'receita' | 'despesa'
  tipo text,
  valor numeric(12,2) not null,
  moeda text not null default 'BRL',
  -- status: 'previsto' | 'pago' | 'recebido' | 'atrasado' | 'cancelado'
  status text,
  data_competencia date,
  data_vencimento date,
  data_pagamento date,
  categoria_id uuid references categorias_financeiras (id) on delete set null,
  pessoa_id uuid references pessoas (id) on delete set null,
  projeto_id uuid references projetos (id) on delete set null,
  campanha_id uuid references campanhas (id) on delete set null,
  produto_id uuid references produtos (id) on delete set null,
  parcelamento_id uuid references parcelamentos (id) on delete set null,
  numero_parcela integer,
  forma_pagamento text,
  comprovante_url text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table movimentacoes_financeiras is 'Lancamentos de receita e despesa (previstos e realizados) - livro-caixa do sistema.';

-- ============================================================
-- 20. orcamentos
-- ============================================================
create table if not exists orcamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  projeto_id uuid references projetos (id) on delete set null,
  campanha_id uuid references campanhas (id) on delete set null,
  categoria_id uuid references categorias_financeiras (id) on delete set null,
  valor_previsto numeric(12,2) not null default 0,
  valor_realizado numeric(12,2) not null default 0,
  periodo_inicio date,
  periodo_fim date,
  status text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table orcamentos is 'Metas de gasto/receita por projeto, campanha ou categoria em um periodo.';

-- ============================================================
-- 21. metas
-- ============================================================
create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  -- tipo: 'financeira' | 'audiencia' | 'vendas' | 'producao' | 'pessoal'
  tipo text,
  indicador text,
  unidade text,
  valor_alvo numeric(14,2),
  valor_atual numeric(14,2) not null default 0,
  periodo_inicio date,
  periodo_fim date,
  status text,
  projeto_id uuid references projetos (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table metas is 'Objetivos mensuraveis com valor-alvo e acompanhamento de progresso.';

-- ============================================================
-- 22. documentos
-- ============================================================
create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  -- tipo: 'contrato' | 'proposta' | 'briefing' | 'ata' | 'recibo' | 'outro'
  tipo text,
  descricao text,
  url text,
  storage_path text,
  mime_type text,
  tamanho_bytes bigint,
  -- entidade_tipo / entidade_id: vinculo polimorfico opcional
  entidade_tipo text,
  entidade_id uuid,
  pessoa_id uuid references pessoas (id) on delete set null,
  projeto_id uuid references projetos (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table documentos is 'Arquivos e documentos anexados, com metadados e vinculo opcional a outra entidade.';

-- ============================================================
-- 23. timeline_eventos
-- ============================================================
create table if not exists timeline_eventos (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null,
  entidade_id uuid not null,
  -- tipo_evento: 'criacao' | 'atualizacao' | 'mudanca_status' | 'comentario' | 'anexo'
  tipo_evento text not null,
  descricao text,
  dados jsonb,
  ator_id uuid references pessoas (id) on delete set null,
  created_at timestamptz not null default now(),
  arquivado_em timestamptz
);
comment on table timeline_eventos is 'Log cronologico de atividades e mudancas por entidade (feed de historico).';

-- ============================================================
-- 24. Tabelas de relacionamento (N:N)
-- ============================================================

create table if not exists pessoa_produto (
  pessoa_id uuid not null references pessoas (id) on delete cascade,
  produto_id uuid not null references produtos (id) on delete cascade,
  -- papel: 'comprador' | 'interessado' | 'afiliado'
  papel text,
  created_at timestamptz not null default now(),
  primary key (pessoa_id, produto_id)
);

create table if not exists pessoa_edicao (
  pessoa_id uuid not null references pessoas (id) on delete cascade,
  edicao_id uuid not null references edicoes_evento (id) on delete cascade,
  -- papel: 'inscrito' | 'palestrante' | 'organizacao'
  papel text,
  -- status: 'confirmado' | 'presente' | 'ausente' | 'cancelado'
  status text,
  created_at timestamptz not null default now(),
  primary key (pessoa_id, edicao_id)
);

create table if not exists pessoa_tag (
  pessoa_id uuid not null references pessoas (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pessoa_id, tag_id)
);

create table if not exists produto_projeto (
  produto_id uuid not null references produtos (id) on delete cascade,
  projeto_id uuid not null references projetos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (produto_id, projeto_id)
);

create table if not exists produto_campanha (
  produto_id uuid not null references produtos (id) on delete cascade,
  campanha_id uuid not null references campanhas (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (produto_id, campanha_id)
);

create table if not exists tarefa_tag (
  tarefa_id uuid not null references tarefas (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tarefa_id, tag_id)
);

create table if not exists conteudo_tag (
  conteudo_id uuid not null references conteudos (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conteudo_id, tag_id)
);

create table if not exists documento_tag (
  documento_id uuid not null references documentos (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (documento_id, tag_id)
);

create table if not exists ideia_tag (
  ideia_id uuid not null references ideias (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ideia_id, tag_id)
);

-- ============================================================
-- Indices de chave estrangeira e filtros comuns
-- ============================================================
create index if not exists idx_categorias_financeiras_parent on categorias_financeiras (parent_id);
create index if not exists idx_versoes_produto_produto on versoes_produto (produto_id);
create index if not exists idx_projetos_responsavel on projetos (responsavel_id);
create index if not exists idx_fases_projeto_projeto on fases_projeto (projeto_id);
create index if not exists idx_edicoes_evento_evento on edicoes_evento (evento_id);
create index if not exists idx_tarefas_parent on tarefas (parent_id);
create index if not exists idx_tarefas_projeto on tarefas (projeto_id);
create index if not exists idx_tarefas_produto on tarefas (produto_id);
create index if not exists idx_tarefas_fase on tarefas (fase_id);
create index if not exists idx_tarefas_responsavel on tarefas (responsavel_id);
create index if not exists idx_notas_entidade on notas (entidade_tipo, entidade_id);
create index if not exists idx_conteudos_produto on conteudos (produto_id);
create index if not exists idx_conteudos_projeto on conteudos (projeto_id);
create index if not exists idx_conteudos_responsavel on conteudos (responsavel_id);
create index if not exists idx_versoes_conteudo_conteudo on versoes_conteudo (conteudo_id);
create index if not exists idx_campanhas_projeto on campanhas (projeto_id);
create index if not exists idx_acoes_organicas_campanha on acoes_organicas (campanha_id);
create index if not exists idx_acoes_organicas_conteudo on acoes_organicas (conteudo_id);
create index if not exists idx_parcelamentos_pessoa on parcelamentos (pessoa_id);
create index if not exists idx_movfin_categoria on movimentacoes_financeiras (categoria_id);
create index if not exists idx_movfin_pessoa on movimentacoes_financeiras (pessoa_id);
create index if not exists idx_movfin_projeto on movimentacoes_financeiras (projeto_id);
create index if not exists idx_movfin_campanha on movimentacoes_financeiras (campanha_id);
create index if not exists idx_movfin_produto on movimentacoes_financeiras (produto_id);
create index if not exists idx_movfin_parcelamento on movimentacoes_financeiras (parcelamento_id);
create index if not exists idx_movfin_vencimento on movimentacoes_financeiras (data_vencimento);
create index if not exists idx_orcamentos_projeto on orcamentos (projeto_id);
create index if not exists idx_orcamentos_campanha on orcamentos (campanha_id);
create index if not exists idx_orcamentos_categoria on orcamentos (categoria_id);
create index if not exists idx_metas_projeto on metas (projeto_id);
create index if not exists idx_documentos_pessoa on documentos (pessoa_id);
create index if not exists idx_documentos_projeto on documentos (projeto_id);
create index if not exists idx_documentos_entidade on documentos (entidade_tipo, entidade_id);
create index if not exists idx_timeline_eventos_entidade on timeline_eventos (entidade_tipo, entidade_id);
create index if not exists idx_timeline_eventos_ator on timeline_eventos (ator_id);
create index if not exists idx_timeline_eventos_created_at on timeline_eventos (created_at);

commit;
