import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { detectarColunasEdicao } from "../db";
import { EventoDetalhe } from "../components/EventoDetalhe";

const EDICAO_BASE_COLS =
  "id, evento_id, nome, numero, status, formato, local, link_transmissao, capacidade, data_inicio, data_fim";
const EDICAO_COLS_OPCIONAIS = [
  "modelo_acesso",
  "preco",
  "projeto_id",
  "resumo",
] as const;

type Row = Record<string, unknown>;

export default async function EventoPerfilPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: evento } = await supabase
    .from("eventos")
    .select("id, nome, descricao, tipo, status, arquivado_em")
    .eq("id", params.id)
    .maybeSingle();

  if (!evento) notFound();

  const cols = await detectarColunasEdicao(supabase);
  const selectEdicao = [
    EDICAO_BASE_COLS,
    ...EDICAO_COLS_OPCIONAIS.filter((c) => cols.has(c)),
  ].join(", ");

  const [{ data: edicoesRaw }, { data: projetos }, { data: clientes }] =
    await Promise.all([
      supabase
        .from("edicoes_evento")
        .select(selectEdicao)
        .eq("evento_id", params.id)
        .is("arquivado_em", null)
        .order("numero", { ascending: true, nullsFirst: false })
        .order("data_inicio", { ascending: true, nullsFirst: false }),
      supabase
        .from("projetos")
        .select("id, nome")
        .is("arquivado_em", null)
        .order("nome")
        .limit(200),
      supabase
        .from("pessoas")
        .select("id, nome")
        .is("arquivado_em", null)
        .order("nome")
        .limit(500),
    ]);

  const edicoesRows = (edicoesRaw ?? []) as unknown as Row[];
  const edicaoIds = edicoesRows.map((e) => e.id as string);

  let participantes: {
    edicao_id: string;
    pessoa_id: string;
    nome: string;
    papel: string | null;
    status: string | null;
  }[] = [];

  if (edicaoIds.length > 0) {
    const { data } = await supabase
      .from("pessoa_edicao")
      .select("pessoa_id, edicao_id, papel, status, pessoas(nome)")
      .in("edicao_id", edicaoIds);

    participantes = ((data ?? []) as unknown as Row[]).map((p) => {
      const pessoa = p.pessoas as { nome?: string } | null;
      return {
        edicao_id: p.edicao_id as string,
        pessoa_id: p.pessoa_id as string,
        nome: pessoa?.nome ?? "—",
        papel: (p.papel as string | null) ?? null,
        status: (p.status as string | null) ?? null,
      };
    });
  }

  const contagem = new Map<string, number>();
  for (const p of participantes) {
    contagem.set(p.edicao_id, (contagem.get(p.edicao_id) ?? 0) + 1);
  }

  const edicoes = edicoesRows.map((row) => ({
    id: row.id as string,
    nome: (row.nome as string | null) ?? null,
    numero: (row.numero as number | null) ?? null,
    status: (row.status as string | null) ?? null,
    formato: (row.formato as string | null) ?? null,
    local: (row.local as string | null) ?? null,
    link_transmissao: (row.link_transmissao as string | null) ?? null,
    capacidade: (row.capacidade as number | null) ?? null,
    data_inicio: (row.data_inicio as string | null) ?? null,
    data_fim: (row.data_fim as string | null) ?? null,
    modelo_acesso: (row.modelo_acesso as string | null) ?? null,
    preco: (row.preco as number | string | null) ?? null,
    projeto_id: (row.projeto_id as string | null) ?? null,
    resumo: (row.resumo as string | null) ?? null,
    inscritos: contagem.get(row.id as string) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard/eventos"
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← Eventos
      </Link>

      <EventoDetalhe
        evento={{
          id: evento.id,
          nome: evento.nome,
          descricao: evento.descricao,
          tipo: evento.tipo,
          status: evento.status,
          arquivado_em: evento.arquivado_em,
        }}
        edicoes={edicoes}
        participantes={participantes}
        clientes={(clientes ?? []) as { id: string; nome: string }[]}
        projetos={(projetos ?? []) as { id: string; nome: string }[]}
        colunasEdicao={Array.from(cols)}
      />
    </div>
  );
}
