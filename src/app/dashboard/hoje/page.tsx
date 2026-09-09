import { createClient } from "@/lib/supabase/server";
import type {
  NotaHoje,
  OptionLite,
  TagLite,
  TarefaHoje,
  VinculoOpcoes,
} from "./actions";
import { detectarColunasTarefa } from "./db";
import { HojeView } from "./components/HojeView";

const TZ = "America/Sao_Paulo";

// Sempre presentes em `tarefas`.
const TAREFA_BASE_COLS =
  "id, titulo, descricao, status, prioridade, data_prazo, projeto_id";

// Opcionais (migrações 0003/0006) — só entram no select se existirem.
const COLS_OPCIONAIS = [
  "produto_id",
  "evento_id",
  "cliente_id",
  "ideia_id",
  "campanha_id",
  "agenda_data",
  "agenda_hora_inicio",
  "agenda_hora_fim",
] as const;

function dataISO(date: Date): string {
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
  const rels = (row.tarefa_tag as { tag_id: string }[] | null) ?? [];
  return {
    id: row.id as string,
    titulo: row.titulo as string,
    descricao: (row.descricao as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    prioridade: (row.prioridade as string | null) ?? null,
    data_prazo: (row.data_prazo as string | null) ?? null,
    agenda_data: (row.agenda_data as string | null) ?? null,
    agenda_hora_inicio: (row.agenda_hora_inicio as string | null) ?? null,
    agenda_hora_fim: (row.agenda_hora_fim as string | null) ?? null,
    projeto_id: (row.projeto_id as string | null) ?? null,
    produto_id: (row.produto_id as string | null) ?? null,
    evento_id: (row.evento_id as string | null) ?? null,
    cliente_id: (row.cliente_id as string | null) ?? null,
    ideia_id: (row.ideia_id as string | null) ?? null,
    campanha_id: (row.campanha_id as string | null) ?? null,
    tag_ids: rels.map((r) => r.tag_id),
  };
}

function toLista(res: { data: unknown }): TarefaHoje[] {
  return ((res.data ?? []) as Record<string, unknown>[]).map(mapTarefa);
}

async function opcoes(
  supabase: ReturnType<typeof createClient>,
  tabela: string,
  coluna: "nome" | "titulo",
): Promise<OptionLite[]> {
  const { data } = await supabase
    .from(tabela)
    .select(`id, ${coluna}`)
    .is("arquivado_em", null)
    .order(coluna)
    .limit(200);
  return ((data ?? []) as Record<string, string>[]).map((row) => ({
    id: row.id,
    nome: row[coluna] || "(sem nome)",
  }));
}

export default async function HojePage() {
  const supabase = createClient();

  const agora = new Date();
  const hoje = dataISO(agora);
  const inicioHoje = `${hoje}T00:00:00`;
  const fimHoje = `${hoje}T23:59:59.999`;

  const cols = await detectarColunasTarefa(supabase);
  const temAgenda = cols.has("agenda_data");
  const select =
    [TAREFA_BASE_COLS, ...COLS_OPCIONAIS.filter((c) => cols.has(c))].join(", ") +
    ", tarefa_tag(tag_id)";

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
    projetos,
    produtos,
    eventos,
    clientes,
    ideias,
    campanhas,
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
    opcoes(supabase, "projetos", "nome"),
    opcoes(supabase, "produtos", "nome"),
    opcoes(supabase, "eventos", "nome"),
    opcoes(supabase, "pessoas", "nome"),
    opcoes(supabase, "ideias", "titulo"),
    opcoes(supabase, "campanhas", "nome"),
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

  const vinculos: VinculoOpcoes = {
    projeto: projetos,
    produto: produtos,
    evento: eventos,
    cliente: clientes,
    ideia: ideias,
    campanha: campanhas,
  };

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
          vinculos={vinculos}
          tags={(tagsRes.data ?? []) as TagLite[]}
          colunas={Array.from(cols)}
        />
      )}
    </div>
  );
}
