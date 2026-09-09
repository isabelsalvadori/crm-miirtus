import { createClient } from "@/lib/supabase/server";
import type { NotaHoje, TarefaHoje } from "./actions";
import { HojeView } from "./components/HojeView";

const TZ = "America/Sao_Paulo";

const TAREFA_COLS =
  "id, titulo, status, prioridade, data_prazo, agenda_data, agenda_hora_inicio, agenda_hora_fim";

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

export default async function HojePage() {
  const supabase = createClient();

  const agora = new Date();
  const hoje = dataISO(agora);
  const inicioHoje = `${hoje}T00:00:00`;
  const fimHoje = `${hoje}T23:59:59.999`;

  const base = () =>
    supabase
      .from("tarefas")
      .select(TAREFA_COLS)
      .is("arquivado_em", null)
      .is("parent_id", null);

  const [
    tarefasHojeRes,
    atrasadasRes,
    emAndamentoRes,
    prioritariasRes,
    aguardandoRes,
    notasRes,
  ] = await Promise.all([
    base()
      .or(
        `agenda_data.eq.${hoje},and(data_prazo.gte.${inicioHoje},data_prazo.lte.${fimHoje})`,
      )
      .neq("status", "concluida")
      .limit(50),
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
  ]);

  const erro =
    tarefasHojeRes.error ||
    atrasadasRes.error ||
    emAndamentoRes.error ||
    prioritariasRes.error ||
    aguardandoRes.error ||
    notasRes.error;

  const tarefasHoje = (tarefasHojeRes.data ?? []) as TarefaHoje[];
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
          atrasadas={(atrasadasRes.data ?? []) as TarefaHoje[]}
          emAndamento={(emAndamentoRes.data ?? []) as TarefaHoje[]}
          prioridades={(prioritariasRes.data ?? []) as TarefaHoje[]}
          aguardando={(aguardandoRes.data ?? []) as TarefaHoje[]}
          notas={(notasRes.data ?? []) as NotaHoje[]}
        />
      )}
    </div>
  );
}
