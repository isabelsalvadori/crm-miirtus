import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OK_MESSAGES, PERIODO_VALUES, rangeParaPeriodo } from "./constants";
import {
  buscarMovimentacaoAberta,
  catalogosFinanceiro,
  movimentacoesRecentes,
  resumoMensal,
  totaisPendentes,
} from "./db";
import { FinanceiroTabs } from "./_components/tabs";
import { PeriodoFilter } from "./_components/periodo-filter";
import { ResumoCards } from "./_components/resumo-cards";
import { MovimentacoesTable } from "./_components/movimentacoes-table";
import { MovimentacaoModal } from "./_components/movimentacao-modal";
import { Toast } from "./_components/toast";

type SearchParams = {
  periodo?: string;
  inicio?: string;
  fim?: string;
  nova?: string;
  mov?: string;
  ok?: string;
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  const periodo = PERIODO_VALUES.includes(searchParams.periodo ?? "")
    ? (searchParams.periodo as string)
    : "mes_atual";
  const range = rangeParaPeriodo(periodo, {
    inicio: searchParams.inicio,
    fim: searchParams.fim,
  });

  const [resumo, pendentes, { produtos, projetos, categoriasReceita, categoriasDespesa }] =
    await Promise.all([
      resumoMensal(supabase),
      totaisPendentes(supabase),
      catalogosFinanceiro(supabase),
    ]);

  const produtoNome = new Map(produtos.map((p) => [p.id, p.nome]));
  const projetoNome = new Map(projetos.map((p) => [p.id, p.nome]));

  const recentes = await movimentacoesRecentes(supabase, range, produtoNome, projetoNome, 10);

  // ----- Modal -----
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
    ? ((movAberta.tipo as "receita" | "despesa") ?? "receita")
    : (novaTipo ?? "receita");

  const okMessage = searchParams.ok ? OK_MESSAGES[searchParams.ok] ?? null : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#24483F]">Financeiro</h2>
          <p className="mt-1 text-sm text-gray-500">Visão geral do caixa</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="?nova=receita"
            scroll={false}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            + Nova Receita
          </Link>
          <Link
            href="?nova=despesa"
            scroll={false}
            className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
          >
            + Nova Despesa
          </Link>
        </div>
      </div>

      <FinanceiroTabs />

      {okMessage && <Toast message={okMessage} />}

      <ResumoCards resumo={resumo} aReceber={pendentes.aReceber} aPagar={pendentes.aPagar} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">Movimentações recentes</h3>
        <PeriodoFilter />
      </div>

      <div className="rounded-xl border border-black/5 bg-white shadow-sm">
        {recentes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-gray-700">
              Nenhuma movimentação neste período.
            </p>
          </div>
        ) : (
          <MovimentacoesTable movimentacoes={recentes} mostrarTipo />
        )}
      </div>

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
