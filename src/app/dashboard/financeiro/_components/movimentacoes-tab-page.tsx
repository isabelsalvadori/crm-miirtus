import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  OK_MESSAGES,
  PERIODO_VALUES,
  STATUS_DESPESA_FORM_VALUES,
  STATUS_RECEITA_FORM_VALUES,
  rangeParaPeriodo,
  sanitizeSearch,
  ymd,
} from "../constants";
import { catalogosFinanceiro, buscarMovimentacaoAberta, mapMovimentacaoRow, MOVIMENTACAO_SELECT } from "../db";
import type { MovimentacaoFull } from "../types";
import { FinanceiroTabs } from "./tabs";
import { MovimentacoesFilters } from "./movimentacoes-filters";
import { MovimentacoesTable } from "./movimentacoes-table";
import { MovimentacaoModal } from "./movimentacao-modal";
import { Pagination } from "./pagination";
import { Toast } from "./toast";

const PAGE_SIZE = 20;

export type MovimentacoesTabPageProps = {
  searchParams: {
    q?: string;
    categoria?: string;
    status?: string;
    vinculo?: string;
    periodo?: string;
    inicio?: string;
    fim?: string;
    page?: string;
    nova?: string;
    mov?: string;
    ok?: string;
  };
  tipoFixo: "receita" | "despesa";
  /** A Receber / A Pagar: só o que ainda está pendente, sem filtro de período. */
  somentePendentes?: boolean;
  titulo: string;
  novoLabel: string;
};

export async function MovimentacoesTabPage({
  searchParams,
  tipoFixo,
  somentePendentes = false,
  titulo,
  novoLabel,
}: MovimentacoesTabPageProps) {
  const supabase = createClient();

  const rawQuery = (searchParams.q ?? "").trim();
  const search = sanitizeSearch(rawQuery);
  const categoria = searchParams.categoria ?? "";
  const vinculo = searchParams.vinculo ?? "";
  const statusValues =
    tipoFixo === "despesa" ? STATUS_DESPESA_FORM_VALUES : STATUS_RECEITA_FORM_VALUES;
  const statusFiltro =
    searchParams.status === "atrasado" || statusValues.includes(searchParams.status ?? "")
      ? (searchParams.status as string)
      : "";
  const periodo = PERIODO_VALUES.includes(searchParams.periodo ?? "")
    ? (searchParams.periodo as string)
    : "mes_atual";
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const hoje = ymd();

  const { produtos, projetos, categoriasReceita, categoriasDespesa } =
    await catalogosFinanceiro(supabase);

  let query = supabase
    .from("movimentacoes_financeiras")
    .select(MOVIMENTACAO_SELECT, { count: "exact" })
    .is("arquivado_em", null)
    .eq("tipo", tipoFixo)
    .order("data_competencia", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE - 1);

  if (somentePendentes) {
    query = query.eq("status", "previsto");
  } else {
    const range = rangeParaPeriodo(periodo, {
      inicio: searchParams.inicio,
      fim: searchParams.fim,
    });
    query = query.gte("data_competencia", range.inicio).lte("data_competencia", range.fim);
  }

  if (search) query = query.ilike("descricao", `%${search}%`);
  if (categoria) query = query.eq("categoria_id", categoria);
  if (vinculo === "sem_vinculo") {
    query = query.is("produto_id", null).is("projeto_id", null);
  } else if (vinculo.startsWith("produto:")) {
    query = query.eq("produto_id", vinculo.slice("produto:".length));
  } else if (vinculo.startsWith("projeto:")) {
    query = query.eq("projeto_id", vinculo.slice("projeto:".length));
  }

  if (statusFiltro) {
    if (statusFiltro === "atrasado") {
      query = query.eq("status", "previsto").lt("data_vencimento", hoje);
    } else if (statusFiltro === "previsto") {
      query = query.eq("status", "previsto").or(`data_vencimento.is.null,data_vencimento.gte.${hoje}`);
    } else {
      query = query.eq("status", statusFiltro);
    }
  }

  const { data, count, error } = await query;

  const produtoNome = new Map(produtos.map((p) => [p.id, p.nome]));
  const projetoNome = new Map(projetos.map((p) => [p.id, p.nome]));
  const movimentacoes: MovimentacaoFull[] = (data ?? []).map((row) =>
    mapMovimentacaoRow(row as never, produtoNome, projetoNome),
  );

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(rawQuery || categoria || statusFiltro || vinculo);

  // ----- Modal ----- (o "+ Nova Receita/Despesa" abre independente da aba atual)
  const novaTipo =
    searchParams.nova === "receita" || searchParams.nova === "despesa"
      ? searchParams.nova
      : null;
  const movId = searchParams.mov ?? null;
  const movAberta = movId
    ? await buscarMovimentacaoAberta(supabase, movId, produtoNome, projetoNome)
    : null;
  const modalOpen = Boolean(novaTipo) || Boolean(movAberta);
  const tipoModal: "receita" | "despesa" = movAberta
    ? ((movAberta.tipo as "receita" | "despesa") ?? tipoFixo)
    : (novaTipo ?? tipoFixo);

  const okMessage = searchParams.ok ? OK_MESSAGES[searchParams.ok] ?? null : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#24483F]">Financeiro</h2>
          <p className="mt-1 text-sm text-gray-500">
            {total} {total === 1 ? "registro" : "registros"} em {titulo.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="?nova=receita"
            scroll={false}
            className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
          >
            + Nova Receita
          </Link>
          <Link
            href="?nova=despesa"
            scroll={false}
            className="rounded-md border border-black/10 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            + Nova Despesa
          </Link>
        </div>
      </div>

      <FinanceiroTabs />

      {okMessage && <Toast message={okMessage} />}

      <MovimentacoesFilters
        tipo={tipoFixo}
        categorias={tipoFixo === "despesa" ? categoriasDespesa : categoriasReceita}
        produtos={produtos}
        projetos={projetos}
        mostrarPeriodo={!somentePendentes}
        somentePendentes={somentePendentes}
      />

      <div className="rounded-xl border border-black/5 bg-white shadow-sm">
        {error ? (
          <p className="p-6 text-sm text-red-600">
            Não foi possível carregar as movimentações. Recarregue a página.
          </p>
        ) : movimentacoes.length === 0 ? (
          <EmptyState hasFilters={hasFilters} novoLabel={novoLabel} tipoFixo={tipoFixo} />
        ) : (
          <MovimentacoesTable movimentacoes={movimentacoes} />
        )}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}

      {modalOpen && (
        <MovimentacaoModal
          key={movId ?? `nova-${tipoModal}`}
          tipo={tipoModal}
          mov={movAberta}
          categoriasReceita={categoriasReceita}
          categoriasDespesa={categoriasDespesa}
          produtos={produtos}
          projetos={projetos}
        />
      )}
    </div>
  );
}

function EmptyState({
  hasFilters,
  novoLabel,
  tipoFixo,
}: {
  hasFilters: boolean;
  novoLabel: string;
  tipoFixo: "receita" | "despesa";
}) {
  if (hasFilters) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm font-medium text-gray-700">
          Nenhuma movimentação encontrada com esses filtros.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Ajuste a busca ou limpe os filtros para ver todas.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm font-medium text-gray-700">Nada por aqui ainda.</p>
      <Link
        href={`?nova=${tipoFixo}`}
        scroll={false}
        className="mt-4 inline-block rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
      >
        {novoLabel}
      </Link>
    </div>
  );
}
