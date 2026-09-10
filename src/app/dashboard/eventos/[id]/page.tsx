import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  OptionLite,
  TagLite,
  TarefaHoje,
  VinculoOpcoes,
} from "@/app/dashboard/hoje/actions";
import { detectarColunasTarefa } from "@/app/dashboard/hoje/db";
import { detectarColunasEdicao, eventoTemTipoFormato } from "../db";
import { EventoDetalhe } from "../components/EventoDetalhe";
import type { DocumentoEvento } from "../components/EventoDocumentos";

const EDICAO_BASE_COLS =
  "id, evento_id, nome, numero, status, formato, local, link_transmissao, capacidade, data_inicio, data_fim";
const EDICAO_COLS_OPCIONAIS = [
  "modelo_acesso",
  "preco",
  "projeto_id",
  "resumo",
] as const;

// Colunas de `tarefas`: as sempre presentes + as opcionais (migrações 0003/0006).
const TAREFA_BASE_COLS =
  "id, titulo, descricao, status, prioridade, data_prazo, projeto_id";
const TAREFA_COLS_OPCIONAIS = [
  "produto_id",
  "evento_id",
  "cliente_id",
  "ideia_id",
  "campanha_id",
  "agenda_data",
  "agenda_hora_inicio",
  "agenda_hora_fim",
] as const;

type Row = Record<string, unknown>;

function mapTarefa(row: Row): TarefaHoje {
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
    .limit(200);
  return ((data ?? []) as Record<string, string>[]).map((row) => ({
    id: row.id,
    nome: row[coluna] || "(sem nome)",
  }));
}

export default async function EventoPerfilPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const temTipoFormato = await eventoTemTipoFormato(supabase);

  const { data: evento } = await supabase
    .from("eventos")
    .select("id, nome, descricao, tipo, status, arquivado_em")
    .eq("id", params.id)
    .maybeSingle();

  if (!evento) notFound();
  const ev = evento as {
    id: string;
    nome: string;
    descricao: string | null;
    tipo: string | null;
    status: string | null;
    arquivado_em: string | null;
  };

  let tipoFormato = "edicoes";
  if (temTipoFormato) {
    const { data } = await supabase
      .from("eventos")
      .select("tipo_formato")
      .eq("id", params.id)
      .maybeSingle();
    tipoFormato = (data?.tipo_formato as string | null) ?? "edicoes";
  }

  const cols = await detectarColunasEdicao(supabase);
  const selectEdicao = [
    EDICAO_BASE_COLS,
    ...EDICAO_COLS_OPCIONAIS.filter((c) => cols.has(c)),
  ].join(", ");

  const tarefaCols = await detectarColunasTarefa(supabase);
  const selectTarefa =
    [
      TAREFA_BASE_COLS,
      ...TAREFA_COLS_OPCIONAIS.filter((c) => tarefaCols.has(c)),
    ].join(", ") + ", tarefa_tag(tag_id)";
  const temVinculoEvento = tarefaCols.has("evento_id");

  const [
    { data: edicoesRaw },
    { data: projetos },
    { data: clientes },
    produtos,
    ideias,
    campanhas,
    { data: tags },
    tarefasRes,
    { data: documentosRaw },
  ] = await Promise.all([
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
    opcoes(supabase, "produtos", "nome"),
    opcoes(supabase, "ideias", "titulo"),
    opcoes(supabase, "campanhas", "nome"),
    supabase.from("tags").select("id, nome, cor").order("nome"),
    temVinculoEvento
      ? supabase
          .from("tarefas")
          .select(selectTarefa)
          .eq("evento_id", params.id)
          .is("arquivado_em", null)
          .order("data_prazo", { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] as Row[] }),
    supabase
      .from("documentos")
      .select("id, titulo, tipo, descricao, url, created_at")
      .eq("entidade_tipo", "evento")
      .eq("entidade_id", params.id)
      .is("arquivado_em", null)
      .order("created_at", { ascending: false }),
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

  const tarefas = ((tarefasRes.data ?? []) as unknown as Row[]).map(mapTarefa);
  const documentos = (
    (documentosRaw ?? []) as unknown as Row[]
  ).map((d) => ({
    id: d.id as string,
    titulo: d.titulo as string,
    tipo: (d.tipo as string | null) ?? null,
    descricao: (d.descricao as string | null) ?? null,
    url: (d.url as string | null) ?? null,
  })) as DocumentoEvento[];

  const projetosOpt = (projetos ?? []) as OptionLite[];
  const clientesOpt = (clientes ?? []) as OptionLite[];

  const tarefaVinculos: VinculoOpcoes = {
    projeto: projetosOpt,
    produto: produtos,
    evento: [{ id: ev.id, nome: ev.nome }],
    cliente: clientesOpt,
    ideia: ideias,
    campanha: campanhas,
  };

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
          id: ev.id,
          nome: ev.nome,
          descricao: ev.descricao,
          tipo: ev.tipo,
          status: ev.status,
          tipo_formato: tipoFormato,
          arquivado_em: ev.arquivado_em,
        }}
        edicoes={edicoes}
        participantes={participantes}
        clientes={clientesOpt}
        projetos={projetosOpt}
        colunasEdicao={Array.from(cols)}
        tarefas={tarefas}
        documentos={documentos}
        tarefaVinculos={tarefaVinculos}
        tarefaTags={(tags ?? []) as TagLite[]}
        tarefaColunas={Array.from(tarefaCols)}
        tarefasHabilitadas={temVinculoEvento}
      />
    </div>
  );
}
