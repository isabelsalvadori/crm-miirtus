import { createClient } from "@/lib/supabase/server";
import { EventosList, type EventoCard } from "./components/EventosList";

export default async function EventosPage() {
  const supabase = createClient();
  const hoje = new Date().toISOString().slice(0, 10);

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

  let edicoes: {
    evento_id: string;
    data_inicio: string | null;
    status: string | null;
  }[] = [];

  if (lista.length > 0) {
    const { data } = await supabase
      .from("edicoes_evento")
      .select("evento_id, data_inicio, status")
      .in(
        "evento_id",
        lista.map((e) => e.id),
      )
      .is("arquivado_em", null);
    edicoes = data ?? [];
  }

  const cards: EventoCard[] = lista.map((evento) => {
    const doEvento = edicoes.filter((x) => x.evento_id === evento.id);
    const proxima = doEvento
      .filter(
        (x) =>
          x.status !== "cancelada" &&
          x.data_inicio &&
          x.data_inicio.slice(0, 10) >= hoje,
      )
      .sort((a, b) =>
        (a.data_inicio ?? "").localeCompare(b.data_inicio ?? ""),
      )[0];

    return {
      id: evento.id,
      nome: evento.nome,
      tipo: evento.tipo,
      status: evento.status,
      total_edicoes: doEvento.length,
      proxima_edicao: proxima?.data_inicio ?? null,
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
