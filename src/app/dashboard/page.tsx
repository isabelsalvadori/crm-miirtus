import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./components/DashboardView";
import type {
  CampanhaLite,
  CompromissoLite,
  ConteudoLite,
  FaseLite,
  MetaLite,
  MovLite,
  ProjetoLite,
  RecenteLite,
  TarefaLite,
} from "./components/inicio-types";

const TZ = "America/Sao_Paulo";

const num = (v: unknown): number | null =>
  v == null || v === "" ? null : Number(v);

type QueryLike<T> = PromiseLike<{
  data: T[] | null;
  error: PostgrestError | null;
}>;

/** Executa uma query isoladamente: erro → loga o detalhe e devolve []. */
async function carregar<T>(
  rotulo: string,
  query: QueryLike<T>,
  falhas: string[],
): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error) {
      console.error(
        `[Início] Falha ao carregar "${rotulo}":`,
        error.message,
        error.details ?? "",
        error.hint ?? "",
        error.code ? `(${error.code})` : "",
      );
      falhas.push(rotulo);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error(`[Início] Exceção ao carregar "${rotulo}":`, e);
    falhas.push(rotulo);
    return [];
  }
}

function saoPauloHoje(): { hoje: string; hora: number } {
  const agora = new Date();
  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
  const hora = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      hour: "2-digit",
      hour12: false,
    }).format(agora),
  );
  return { hoje, hora: Number.isNaN(hora) ? new Date().getHours() : hora % 24 };
}

function ultimoDiaDoMes(y: number, m: number): string {
  const d = new Date(y, m, 0); // m = 1-12 → dia 0 do mês seguinte
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function daquiA(dias: number, base: string): string {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function InicioPage() {
  const supabase = createClient();
  const falhas: string[] = [];
  const { hoje, hora } = saoPauloHoje();

  const [ano, mes] = hoje.split("-").map(Number);
  const mesFim = ultimoDiaDoMes(ano, mes);
  const prevAno = mes === 1 ? ano - 1 : ano;
  const prevMes = mes === 1 ? 12 : mes - 1;
  const prevInicio = `${prevAno}-${String(prevMes).padStart(2, "0")}-01`;
  const em7dias = daquiA(7, hoje);

  const [
    tarefasRows,
    compromissosRows,
    movRows,
    metasRows,
    projetosRows,
    fasesRows,
    conteudosRows,
    campanhasRows,
    recTarefasRows,
    recProjetosRows,
    recProdutosRows,
  ] = await Promise.all([
    carregar<Record<string, unknown>>(
      "tarefas",
      supabase
        .from("tarefas")
        .select("id, titulo, status, data_prazo, projeto_id")
        .is("arquivado_em", null)
        .is("parent_id", null)
        .limit(4000),
      falhas,
    ),
    carregar<Record<string, unknown>>(
      "compromissos de hoje",
      supabase
        .from("tarefas")
        .select("id, titulo, agenda_hora_inicio")
        .is("arquivado_em", null)
        .eq("agenda_data", hoje)
        .limit(200),
      falhas,
    ),
    carregar<Record<string, unknown>>(
      "financeiro do mês",
      supabase
        .from("movimentacoes_financeiras")
        .select("tipo, valor, status, data_competencia")
        .is("arquivado_em", null)
        .gte("data_competencia", prevInicio)
        .lte("data_competencia", mesFim),
      falhas,
    ),
    carregar<Record<string, unknown>>(
      "metas do mês",
      supabase
        .from("metas")
        .select(
          "id, nome, tipo, unidade, valor_alvo, valor_atual, periodo_inicio, periodo_fim",
        )
        .is("arquivado_em", null)
        .eq("status", "ativa")
        .lte("periodo_inicio", hoje)
        .or(`periodo_fim.gte.${hoje},periodo_fim.is.null`)
        .limit(3),
      falhas,
    ),
    carregar<Record<string, unknown>>(
      "projetos ativos",
      supabase
        .from("projetos")
        .select("id, nome, status, progresso")
        .is("arquivado_em", null)
        .in("status", ["ativo", "em_andamento", "planejamento"]),
      falhas,
    ),
    carregar<Record<string, unknown>>(
      "fases de projeto",
      supabase
        .from("fases_projeto")
        .select("projeto_id, nome, status, ordem")
        .is("arquivado_em", null)
        .order("ordem", { ascending: true }),
      falhas,
    ),
    carregar<Record<string, unknown>>(
      "conteúdos da semana",
      supabase
        .from("conteudos")
        .select("id, titulo, canal, data_agendada")
        .is("arquivado_em", null)
        .gte("data_agendada", hoje)
        .lte("data_agendada", `${em7dias}T23:59:59`),
      falhas,
    ),
    carregar<Record<string, unknown>>(
      "campanhas ativas",
      supabase
        .from("campanhas")
        .select("*")
        .is("arquivado_em", null)
        .eq("status", "ativa"),
      falhas,
    ),
    carregar<Record<string, unknown>>(
      "recentes: tarefas",
      supabase
        .from("tarefas")
        .select("id, titulo, updated_at")
        .is("arquivado_em", null)
        .order("updated_at", { ascending: false })
        .limit(5),
      falhas,
    ),
    carregar<Record<string, unknown>>(
      "recentes: projetos",
      supabase
        .from("projetos")
        .select("id, nome, updated_at")
        .is("arquivado_em", null)
        .order("updated_at", { ascending: false })
        .limit(5),
      falhas,
    ),
    carregar<Record<string, unknown>>(
      "recentes: produtos",
      supabase
        .from("produtos")
        .select("id, nome, updated_at")
        .is("arquivado_em", null)
        .order("updated_at", { ascending: false })
        .limit(5),
      falhas,
    ),
  ]);

  const tarefas: TarefaLite[] = tarefasRows.map((r) => ({
    id: r.id as string,
    titulo: (r.titulo as string) ?? "(sem título)",
    status: (r.status as string | null) ?? null,
    data_prazo: (r.data_prazo as string | null) ?? null,
    projeto_id: (r.projeto_id as string | null) ?? null,
  }));

  const compromissos: CompromissoLite[] = compromissosRows
    .map((r) => ({
      id: r.id as string,
      titulo: (r.titulo as string) ?? "(sem título)",
      hora: ((r.agenda_hora_inicio as string | null) ?? null)?.slice(0, 5) ?? null,
    }))
    .sort((a, b) => (a.hora ?? "99").localeCompare(b.hora ?? "99"));

  const movimentacoes: MovLite[] = movRows.map((r) => ({
    tipo: (r.tipo as string | null) ?? null,
    valor: Number(r.valor) || 0,
    status: (r.status as string | null) ?? null,
    data_competencia: (r.data_competencia as string | null) ?? null,
  }));

  const metas: MetaLite[] = metasRows.map((r) => ({
    id: r.id as string,
    nome: (r.nome as string) ?? "(sem nome)",
    tipo: (r.tipo as string | null) ?? null,
    unidade: (r.unidade as string | null) ?? null,
    valor_alvo: num(r.valor_alvo),
    valor_atual: num(r.valor_atual),
    periodo_inicio: (r.periodo_inicio as string | null) ?? null,
    periodo_fim: (r.periodo_fim as string | null) ?? null,
  }));

  const projetos: ProjetoLite[] = projetosRows.map((r) => ({
    id: r.id as string,
    nome: (r.nome as string) ?? "(sem nome)",
    status: (r.status as string | null) ?? null,
    progresso: num(r.progresso),
  }));

  const fases: FaseLite[] = fasesRows.map((r) => ({
    projeto_id: r.projeto_id as string,
    nome: (r.nome as string) ?? "",
    status: (r.status as string | null) ?? null,
    ordem: Number(r.ordem) || 0,
  }));

  const conteudos: ConteudoLite[] = conteudosRows.map((r) => ({
    id: r.id as string,
    titulo: (r.titulo as string) ?? "(sem título)",
    canal: (r.canal as string | null) ?? null,
    data_agendada: (r.data_agendada as string | null) ?? null,
  }));

  const campanhas: CampanhaLite[] = campanhasRows.map((r) => ({
    id: r.id as string,
    nome: (r.nome as string) ?? "(sem nome)",
    canal: (r.canal_principal as string | null) ?? (r.canal as string | null) ?? null,
    orcamento_planejado: num(r.orcamento_planejado ?? r.orcamento_previsto),
    gasto_real: num(r.gasto_real ?? r.orcamento_realizado),
  }));

  const recentes: RecenteLite[] = [
    ...recTarefasRows.map((r) => ({
      id: r.id as string,
      titulo: (r.titulo as string) ?? "(sem título)",
      tipo: "tarefa" as const,
      updated_at: (r.updated_at as string | null) ?? null,
    })),
    ...recProjetosRows.map((r) => ({
      id: r.id as string,
      titulo: (r.nome as string) ?? "(sem nome)",
      tipo: "projeto" as const,
      updated_at: (r.updated_at as string | null) ?? null,
    })),
    ...recProdutosRows.map((r) => ({
      id: r.id as string,
      titulo: (r.nome as string) ?? "(sem nome)",
      tipo: "produto" as const,
      updated_at: (r.updated_at as string | null) ?? null,
    })),
  ]
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(0, 5);

  return (
    <DashboardView
      data={{
        hoje,
        hora,
        tarefas,
        compromissos,
        movimentacoes,
        metas,
        projetos,
        fases,
        conteudos,
        campanhas,
        recentes,
        falhas,
      }}
    />
  );
}
