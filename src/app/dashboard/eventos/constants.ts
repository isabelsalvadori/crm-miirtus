/**
 * Opções, rótulos, badges e formatadores do módulo de Eventos
 * (tabelas `eventos`, `edicoes_evento`, `pessoa_edicao`).
 */

type Opt = { value: string; label: string };

export const EVENTO_TIPO_OPTIONS: Opt[] = [
  { value: "workshop", label: "Workshop" },
  { value: "palestra", label: "Palestra" },
  { value: "lancamento", label: "Lançamento" },
  { value: "live", label: "Live" },
  { value: "webinar", label: "Webinar" },
  { value: "presencial", label: "Presencial" },
  { value: "outro", label: "Outro" },
];

export const EVENTO_STATUS_OPTIONS: Opt[] = [
  { value: "ativo", label: "Ativo" },
  { value: "encerrado", label: "Encerrado" },
  { value: "arquivado", label: "Arquivado" },
];

// Formato do evento (coluna `eventos.tipo_formato`, migração 0008).
export const EVENTO_FORMATO_OPTIONS: Opt[] = [
  { value: "unico", label: "Evento único" },
  { value: "edicoes", label: "Evento com edições" },
];

// Tipos de documento anexável ao evento (tabela `documentos`).
export const DOCUMENTO_TIPO_OPTIONS: Opt[] = [
  { value: "pdf", label: "PDF" },
  { value: "planilha", label: "Planilha" },
  { value: "apresentacao", label: "Apresentação" },
  { value: "imagem", label: "Imagem" },
  { value: "link", label: "Link" },
  { value: "outro", label: "Outro" },
];

export const DOCUMENTO_TIPO_ICONE: Record<string, string> = {
  pdf: "📄",
  planilha: "📊",
  apresentacao: "📽️",
  imagem: "🖼️",
  link: "🔗",
  outro: "📎",
};

export const EDICAO_STATUS_OPTIONS: Opt[] = [
  { value: "planejada", label: "Planejada" },
  { value: "confirmada", label: "Confirmada" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "encerrada", label: "Encerrada" },
  { value: "cancelada", label: "Cancelada" },
];

export const FORMATO_OPTIONS: Opt[] = [
  { value: "online", label: "Online" },
  { value: "presencial", label: "Presencial" },
  { value: "hibrido", label: "Híbrido" },
];

export const MODELO_ACESSO_OPTIONS: Opt[] = [
  { value: "gratuito", label: "Gratuito" },
  { value: "pago", label: "Pago" },
];

export const PAPEL_OPTIONS: Opt[] = [
  { value: "inscrito", label: "Inscrito" },
  { value: "palestrante", label: "Palestrante" },
  { value: "organizacao", label: "Organização" },
];

export const PARTICIPANTE_STATUS_OPTIONS: Opt[] = [
  { value: "confirmado", label: "Confirmado" },
  { value: "presente", label: "Presente" },
  { value: "ausente", label: "Ausente" },
  { value: "cancelado", label: "Cancelado" },
];

const valores = (opts: Opt[]) => opts.map((o) => o.value);

export const EVENTO_TIPO_VALUES = valores(EVENTO_TIPO_OPTIONS);
export const EVENTO_STATUS_VALUES = valores(EVENTO_STATUS_OPTIONS);
export const EVENTO_FORMATO_VALUES = valores(EVENTO_FORMATO_OPTIONS);
export const DOCUMENTO_TIPO_VALUES = valores(DOCUMENTO_TIPO_OPTIONS);
export const EDICAO_STATUS_VALUES = valores(EDICAO_STATUS_OPTIONS);
export const FORMATO_VALUES = valores(FORMATO_OPTIONS);
export const MODELO_ACESSO_VALUES = valores(MODELO_ACESSO_OPTIONS);
export const PAPEL_VALUES = valores(PAPEL_OPTIONS);
export const PARTICIPANTE_STATUS_VALUES = valores(PARTICIPANTE_STATUS_OPTIONS);

function label(opts: Opt[], value: string | null | undefined, fallback = "—") {
  return opts.find((o) => o.value === value)?.label ?? fallback;
}

export const eventoTipoLabel = (v: string | null | undefined) =>
  label(EVENTO_TIPO_OPTIONS, v, "Outro");
export const eventoFormatoLabel = (v: string | null | undefined) =>
  label(EVENTO_FORMATO_OPTIONS, v, "Evento com edições");
export const documentoTipoLabel = (v: string | null | undefined) =>
  label(DOCUMENTO_TIPO_OPTIONS, v, "Outro");
export const eventoStatusLabel = (v: string | null | undefined) =>
  label(EVENTO_STATUS_OPTIONS, v, "Ativo");
export const edicaoStatusLabel = (v: string | null | undefined) =>
  label(EDICAO_STATUS_OPTIONS, v, "Planejada");
export const formatoLabel = (v: string | null | undefined) =>
  label(FORMATO_OPTIONS, v, "—");
export const modeloAcessoLabel = (v: string | null | undefined) =>
  label(MODELO_ACESSO_OPTIONS, v, "—");
export const papelLabel = (v: string | null | undefined) =>
  label(PAPEL_OPTIONS, v, "Inscrito");
export const participanteStatusLabel = (v: string | null | undefined) =>
  label(PARTICIPANTE_STATUS_OPTIONS, v, "Confirmado");

export const EVENTO_STATUS_BADGE: Record<string, string> = {
  ativo: "bg-[#24483F]/10 text-[#24483F]",
  encerrado: "bg-gray-100 text-gray-500",
  arquivado: "bg-gray-100 text-gray-400",
};

export const EDICAO_STATUS_BADGE: Record<string, string> = {
  planejada: "bg-[#E3BD62]/25 text-[#2D3230]",
  confirmada: "bg-[#24483F]/10 text-[#24483F]",
  em_andamento: "bg-[#B97059]/15 text-[#B97059]",
  encerrada: "bg-gray-100 text-gray-500",
  cancelada: "bg-red-100 text-red-700",
};

export const PARTICIPANTE_STATUS_BADGE: Record<string, string> = {
  confirmado: "bg-[#24483F]/10 text-[#24483F]",
  presente: "bg-emerald-100 text-emerald-700",
  ausente: "bg-amber-100 text-amber-700",
  cancelado: "bg-gray-100 text-gray-400",
};

export function formatData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO/timestamptz -> valor de <input type="datetime-local"> (horário local). */
export function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function formatPreco(value: number | string | null | undefined): string {
  if (value == null || value === "") return "";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function isVindoura(dataInicio: string | null, status: string | null) {
  if (!dataInicio || status === "cancelada") return false;
  return dataInicio.slice(0, 10) >= new Date().toISOString().slice(0, 10);
}
