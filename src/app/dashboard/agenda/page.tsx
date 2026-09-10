import { createClient } from "@/lib/supabase/server";
import type { OptionLite, TagLite, TarefaHoje, VinculoOpcoes } from "../hoje/actions";
import { detectarColunasTarefa } from "../hoje/db";
import { AgendaView, type EdicaoAgenda } from "./components/AgendaView";

const TZ = "America/Sao_Paulo";

const TAREFA_BASE_COLS =
  "id, titulo, descricao, status, prioridade, data_prazo, projeto_id";

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

function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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
    .limit(300);
  return ((data ?? []) as Record<string, string>[]).map((row) => ({
    id: row.id,
    nome: row[coluna] || "(sem nome)",
  }));
}

export default async function AgendaPage() {
  const supabase = createClient();

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

  const [agendadasRes, prazosRes, edicoesRes, projetos, produtos, eventos, clientes, ideias, campanhas, tagsRes] =
    await Promise.all([
      temAgenda
        ? base().not("agenda_data", "is", null).limit(1000)
        : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
      base()
        .not("data_prazo", "is", null)
        .neq("status", "concluida")
        .limit(1000),
      supabase
        .from("edicoes_evento")
        .select("id, evento_id, nome, numero, status, data_inicio, data_fim, eventos(nome)")
        .not("data_inicio", "is", null)
        .neq("status", "cancelada")
        .is("arquivado_em", null)
        .limit(1000),
      opcoes(supabase, "projetos", "nome"),
      opcoes(supabase, "produtos", "nome"),
      opcoes(supabase, "eventos", "nome"),
      opcoes(supabase, "pessoas", "nome"),
      opcoes(supabase, "ideias", "titulo"),
      opcoes(supabase, "campanhas", "nome"),
      supabase.from("tags").select("id, nome, cor").order("nome"),
    ]);

  const erro = agendadasRes.error || prazosRes.error || edicoesRes.error;
  if (erro) console.error("Erro ao carregar a agenda:", erro);

  const tarefas = (
    (agendadasRes.data ?? []) as unknown as Record<string, unknown>[]
  ).map(mapTarefa);
  const prazos = (
    (prazosRes.data ?? []) as unknown as Record<string, unknown>[]
  ).map(mapTarefa);

  const edicoes: EdicaoAgenda[] = (
    (edicoesRes.data ?? []) as unknown as Record<string, unknown>[]
  ).map((row) => {
    const rel = row.eventos as { nome?: string } | { nome?: string }[] | null;
    const eventoNome = Array.isArray(rel) ? rel[0]?.nome : rel?.nome;
    const nomeEdicao = (row.nome as string | null) ?? null;
    const numero = row.numero as number | null;
    const sufixo = nomeEdicao || (numero ? `${numero}ª edição` : null);
    return {
      id: row.id as string,
      evento_id: row.evento_id as string,
      titulo: eventoNome
        ? sufixo
          ? `${eventoNome} · ${sufixo}`
          : eventoNome
        : sufixo ?? "Edição de evento",
      data_inicio: row.data_inicio as string,
      data_fim: (row.data_fim as string | null) ?? null,
      status: (row.status as string | null) ?? null,
    };
  });

  const vinculos: VinculoOpcoes = {
    projeto: projetos,
    produto: produtos,
    evento: eventos,
    cliente: clientes,
    ideia: ideias,
    campanha: campanhas,
  };

  return (
    <div className="mx-auto max-w-6xl">
      {erro ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
          Não foi possível carregar a agenda. Recarregue a página.
        </div>
      ) : (
        <AgendaView
          hojeISO={hojeISO()}
          tarefas={tarefas}
          prazos={prazos}
          edicoes={edicoes}
          vinculos={vinculos}
          tags={(tagsRes.data ?? []) as TagLite[]}
          colunas={Array.from(cols)}
        />
      )}
    </div>
  );
}
