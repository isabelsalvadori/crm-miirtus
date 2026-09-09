-- ============================================================
-- 0004 - Financeiro: seed de categorias padrão
-- Popula categorias_financeiras com as categorias base do módulo
-- de Financeiro. Idempotente (não duplica se já existir nome+tipo).
-- ============================================================

begin;

insert into categorias_financeiras (nome, tipo, ordem)
select v.nome, v.tipo, v.ordem
from (
  values
    ('Venda de Produto', 'receita', 0),
    ('Venda/Retorno Projeto', 'receita', 1),
    ('Parcerias', 'receita', 2),
    ('Outras receitas', 'receita', 3),
    ('Ferramentas', 'despesa', 0),
    ('Fornecedor', 'despesa', 1),
    ('Impostos', 'despesa', 2),
    ('Marketing', 'despesa', 3),
    ('Operacional', 'despesa', 4),
    ('Outras despesas', 'despesa', 5),
    ('Prestador de serviço', 'despesa', 6)
) as v(nome, tipo, ordem)
where not exists (
  select 1
  from categorias_financeiras c
  where c.nome = v.nome and c.tipo = v.tipo
);

commit;
