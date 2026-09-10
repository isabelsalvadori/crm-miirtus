import { createClient } from "@/lib/supabase/server";
import { EventosList, type EventoCard } from "./components/EventosList";
import { eventoTemTipoFormato } from "./db";

export default async function EventosPage() {
  const supabase = createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const temTipoFormato = await eventoTemTipoFormato(supabase);

  const { data: eventos, error } = await supabase
    .from("eventos")
    .select("id, nome, descricao, tipo, status")
    .is("arquivado_em", null)
    .order("created_at", { ascending: false });

  const lista = (eventos ?? []) as {
    id: string;
    nome: string;
    descricao: string | null;
    tipo: string | null;
    status: string | null;
  }[];

  const ids = lista.map((e) => e.id);

  let edicoes: {
    evento_id: string;
    data_inicio: string | null;
    status: string | null;
  }[] = [];
  const formatos = new Map<string, string>();

  if (lista.length > 0) {
    const [{ data: edic }, formatoRes] = await Promise.all([
      supabase
        .from("edicoes_evento")
        .select("evento_id, data_inicio, status")
        .in("evento_id", ids)
        .is("arquivado_em", null),
      temTipoFormato
        ? supabase.from("eventos").select("id, tipo_formato").in("id", ids)
        : Promise.resolve({ data: [] as { id: string; tipo_formato: string | null }[] }),
    ]);
    edicoes = edic ?? [];
    for (const row of (formatoRes.data ?? []) as {
      id: string;
      tipo_formato: string | null;
    }[]) {
      formatos.set(row.id, row.tipo_formato ?? "edicoes");
    }
  }

  const cards: EventoCard[] = lista.map((evento) => {
    const doEvento = edicoes.filter((x) => x.evento_id === evento.id);
    const ordenadas = [...doEvento]
      .filter((x) => x.data_inicio)
      .sort((a, b) =>
        (a.data_inicio ?? "").localeCompare(b.data_inicio ?? ""),
      );
    const proxima = ordenadas.find(
      (x) =>
        x.status !== "cancelada" &&
        (x.data_inicio ?? "").slice(0, 10) >= hoje,
    );

    return {
      id: evento.id,
      nome: evento.nome,
      tipo: evento.tipo,
      status: evento.status,
      tipo_formato: formatos.get(evento.id) ?? "edicoes",
      total_edicoes: doEvento.length,
      proxima_edicao: proxima?.data_inicio ?? null,
      data_unica: ordenadas[0]?.data_inicio ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {error ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
          Não foi possível carregar os eventos. Recarregue a página.
        </div>
      ) : (
        <EventosList eventos={cards} />
      )}
    </div>
  );
}
