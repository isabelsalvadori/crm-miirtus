import { createClient } from "@/lib/supabase/server";
import { detectTarefaColumns } from "../tarefas/db";
import type { NotaHoje, OptionLite, TagLite, TarefaHoje } from "./actions";
import { HojeView } from "./components/HojeView";

const TZ = "America/Sao_Paulo";

// Colunas garantidas em `tarefas`. As de agenda vieram na migração 0003 e
// podem não existir; são detectadas em runtime e o painel degrada sem elas.
const TAREFA_BASE_COLS = "id, titulo, status, prioridade, data_prazo";
const AGENDA_COLS = [
  "agenda_data",
  "agenda_hora_inicio",
  "agenda_hora_fim",
] as const;

function dataISO(date: Date): string {
  // YYYY-MM-DD no fuso de São Paulo
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dataCompletaPtBR(date: Date): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: TZ,
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `Hoje, ${partes.weekday} ${partes.day} de ${partes.month} de ${partes.year}`;
}

function ordenarPorHora(a: TarefaHoje, b: TarefaHoje): number {
  return (a.agenda_hora_inicio ?? "99:99").localeCompare(
    b.agenda_hora_inicio ?? "99:99",
  );
}

function mapTarefa(row: Record<string, unknown>): TarefaHoje {
  return {
    id: row.id as string,
    titulo: row.titulo as string,
    status: (row.status as string | null) ?? null,
    prioridade: (row.prioridade as string | null) ?? null,
    data_prazo: (row.data_prazo as string | null) ?? null,
    agenda_data: (row.agenda_data as string | null) ?? null,
    agenda_hora_inicio: (row.agenda_hora_inicio as string | null) ?? null,
    agenda_hora_fim: (row.agenda_hora_fim as string | null) ?? null,
  };
}

function toLista(res: { data: unknown }): TarefaHoje[] {
  return ((res.data ?? []) as Record<string, unknown>[]).map(mapTarefa);
}

export default async function HojePage() {
  const supabase = createClient();

  const agora = new Date();
  const hoje = dataISO(agora);
  const inicioHoje = `${hoje}T00:00:00`;
  const fimHoje = `${hoje}T23:59:59.999`;

  const cols = await detectTarefaColumns(supabase);
  const temAgenda = cols.has("agenda_data");
  const select = [
    TAREFA_BASE_COLS,
    ...AGENDA_COLS.filter((c) => cols.has(c)),
  ].join(", ");

  const base = () =>
    supabase
      .from("tarefas")
      .select(select)
      .is("arquivado_em", null)
      .is("parent_id", null);

  const tarefasHojeQuery = temAgenda
    ? base()
        .or(
          `agenda_data.eq.${hoje},and(data_prazo.gte.${inicioHoje},data_prazo.lte.${fimHoje})`,
        )
        .neq("status", "concluida")
        .limit(50)
    : base()
        .gte("data_prazo", inicioHoje)
        .lte("data_prazo", fimHoje)
        .neq("status", "concluida")
        .limit(50);

  const [
    tarefasHojeRes,
    atrasadasRes,
    emAndamentoRes,
    prioritariasRes,
    aguardandoRes,
    notasRes,
    projetosRes,
    produtosRes,
    tagsRes,
  ] = await Promise.all([
    tarefasHojeQuery,
    base()
      .lt("data_prazo", inicioHoje)
      .neq("status", "concluida")
      .order("data_prazo", { ascending: true })
      .limit(50),
    base()
      .eq("status", "em_andamento")
      .order("data_prazo", { ascending: true })
      .limit(50),
    base()
      .in("prioridade", ["alta", "urgente"])
      .neq("status", "concluida")
      .order("data_prazo", { ascending: true })
      .limit(50),
    base()
      .eq("status", "aguardando")
      .order("data_prazo", { ascending: true })
      .limit(50),
    supabase
      .from("notas")
      .select("id, titulo, conteudo, created_at")
      .is("arquivado_em", null)
      .gte("created_at", inicioHoje)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("projetos")
      .select("id, nome")
      .is("arquivado_em", null)
      .order("nome"),
    supabase
      .from("produtos")
      .select("id, nome")
      .is("arquivado_em", null)
      .order("nome"),
    supabase.from("tags").select("id, nome, cor").order("nome"),
  ]);

  const erro =
    tarefasHojeRes.error ||
    atrasadasRes.error ||
    emAndamentoRes.error ||
    prioritariasRes.error ||
    aguardandoRes.error ||
    notasRes.error;

  if (erro) console.error("Erro ao carregar o painel de hoje:", erro);

  const tarefasHoje = toLista(tarefasHojeRes);
  const agenda = tarefasHoje
    .filter((t) => t.agenda_data === hoje)
    .sort(ordenarPorHora);
  const prazoHoje = tarefasHoje.filter((t) => t.agenda_data !== hoje);

  return (
    <div className="mx-auto max-w-3xl">
      {erro ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
          Não foi possível carregar o painel de hoje. Recarregue a página.
        </div>
      ) : (
        <HojeView
          dataCompleta={dataCompletaPtBR(agora)}
          agenda={agenda}
          prazoHoje={prazoHoje}
          atrasadas={toLista(atrasadasRes)}
          emAndamento={toLista(emAndamentoRes)}
          prioridades={toLista(prioritariasRes)}
          aguardando={toLista(aguardandoRes)}
          notas={(notasRes.data ?? []) as NotaHoje[]}
          projetos={(projetosRes.data ?? []) as OptionLite[]}
          produtos={(produtosRes.data ?? []) as OptionLite[]}
          tags={(tagsRes.data ?? []) as TagLite[]}
          temProdutoCol={cols.has("produto_id")}
        />
      )}
    </div>
  );
}
