/**
 * Opções, rótulos, badges e formatadores do módulo de Marketing
 * (tabelas `conteudos`, `campanhas`, `acoes_organicas`).
 */

export type Opt = { value: string; label: string };

const valores = (opts: Opt[]) => opts.map((o) => o.value);

function label(opts: Opt[], value: string | null | undefined, fallback = "—") {
  return opts.find((o) => o.value === value)?.label ?? fallback;
}

// ============================================================
// Abas do módulo
// ============================================================

export const MARKETING_TABS = [
  { href: "/dashboard/marketing/conteudo", label: "Conteúdo" },
  { href: "/dashboard/marketing/calendario", label: "Calendário" },
  { href: "/dashboard/marketing/campanhas", label: "Campanhas" },
  { href: "/dashboard/marketing/acoes-organicas", label: "Ações Orgânicas" },
] as const;

// ============================================================
// Conteúdo
// ============================================================

export const CONTEUDO_TIPO_OPTIONS: Opt[] = [
  { value: "post", label: "Post" },
  { value: "reel", label: "Reel" },
  { value: "artigo", label: "Artigo" },
  { value: "video", label: "Vídeo" },
  { value: "email", label: "Email" },
  { value: "carrossel", label: "Carrossel" },
  { value: "story", label: "Story" },
];

export const CONTEUDO_CANAL_OPTIONS: Opt[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "blog", label: "Blog" },
  { value: "newsletter", label: "Newsletter" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "linkedin", label: "LinkedIn" },
];

/** As 6 colunas do Kanban de conteúdo, na ordem do fluxo editorial. */
export const CONTEUDO_STATUS_OPTIONS: Opt[] = [
  { value: "backlog", label: "Backlog" },
  { value: "roteiro", label: "Roteiro/Copy" },
  { value: "gravar", label: "Gravar" },
  { value: "editar", label: "Editar" },
  { value: "postar", label: "Postar" },
  { value: "concluido", label: "Concluído" },
];

export const CONTEUDO_TIPO_VALUES = valores(CONTEUDO_TIPO_OPTIONS);
export const CONTEUDO_CANAL_VALUES = valores(CONTEUDO_CANAL_OPTIONS);
export const CONTEUDO_STATUS_VALUES = valores(CONTEUDO_STATUS_OPTIONS);

export const CONTEUDO_STATUS_PADRAO = "backlog";

export const conteudoTipoLabel = (v: string | null | undefined) =>
  label(CONTEUDO_TIPO_OPTIONS, v, "—");
export const conteudoCanalLabel = (v: string | null | undefined) =>
  label(CONTEUDO_CANAL_OPTIONS, v, "—");
export const conteudoStatusLabel = (v: string | null | undefined) =>
  label(CONTEUDO_STATUS_OPTIONS, v, "Backlog");

export function normalizeConteudoStatus(v: string | null | undefined): string {
  return v && CONTEUDO_STATUS_VALUES.includes(v) ? v : CONTEUDO_STATUS_PADRAO;
}

/** Cor sólida por canal — usada nos badges do calendário e dos cards. */
export const CANAL_COR: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#000000",
  facebook: "#1877F2",
  youtube: "#FF0000",
};

export function canalCor(v: string | null | undefined): string {
  return (v && CANAL_COR[v]) || "#24483F";
}

/** Contraste de texto (preto/branco) para um fundo hex. */
export function textoContraste(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#FFFFFF";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#111827" : "#FFFFFF";
}

// ============================================================
// Campanhas
// ============================================================

export const CAMPANHA_TIPO_OPTIONS: Opt[] = [
  { value: "organica", label: "Orgânica" },
  { value: "paga", label: "Paga" },
  { value: "hibrida", label: "Híbrida" },
];

export const CAMPANHA_STATUS_OPTIONS: Opt[] = [
  { value: "planejada", label: "Planejada" },
  { value: "ativa", label: "Ativa" },
  { value: "pausada", label: "Pausada" },
  { value: "encerrada", label: "Encerrada" },
];

export const CAMPANHA_TIPO_VALUES = valores(CAMPANHA_TIPO_OPTIONS);
export const CAMPANHA_STATUS_VALUES = valores(CAMPANHA_STATUS_OPTIONS);

export const campanhaTipoLabel = (v: string | null | undefined) =>
  label(CAMPANHA_TIPO_OPTIONS, v, "—");
export const campanhaStatusLabel = (v: string | null | undefined) =>
  label(CAMPANHA_STATUS_OPTIONS, v, "Planejada");

export const CAMPANHA_TIPO_BADGE: Record<string, string> = {
  organica: "bg-emerald-100 text-emerald-700",
  paga: "bg-violet-100 text-violet-700",
  hibrida: "bg-sky-100 text-sky-700",
};

export const CAMPANHA_STATUS_BADGE: Record<string, string> = {
  planejada: "bg-[#E3BD62]/25 text-[#2D3230]",
  ativa: "bg-[#24483F]/10 text-[#24483F]",
  pausada: "bg-amber-100 text-amber-700",
  encerrada: "bg-gray-100 text-gray-500",
};

// ============================================================
// Ações Orgânicas
// ============================================================

export const ACAO_TIPO_OPTIONS: Opt[] = [
  { value: "comunidade", label: "Comunidade" },
  { value: "grupo_whatsapp", label: "Grupo WhatsApp" },
  { value: "grupo_facebook", label: "Grupo Facebook" },
  { value: "associacao", label: "Associação" },
  { value: "parceiro", label: "Parceiro" },
  { value: "forum", label: "Fórum" },
  { value: "lista", label: "Lista" },
  { value: "outro", label: "Outro" },
];

export const ACAO_STATUS_OPTIONS: Opt[] = [
  { value: "planejada", label: "Planejada" },
  { value: "ativa", label: "Ativa" },
  { value: "encerrada", label: "Encerrada" },
];

export const ACAO_TIPO_VALUES = valores(ACAO_TIPO_OPTIONS);
export const ACAO_STATUS_VALUES = valores(ACAO_STATUS_OPTIONS);

export const acaoTipoLabel = (v: string | null | undefined) =>
  label(ACAO_TIPO_OPTIONS, v, "Outro");
export const acaoStatusLabel = (v: string | null | undefined) =>
  label(ACAO_STATUS_OPTIONS, v, "Planejada");

export const ACAO_STATUS_BADGE: Record<string, string> = {
  planejada: "bg-[#E3BD62]/25 text-[#2D3230]",
  ativa: "bg-[#24483F]/10 text-[#24483F]",
  encerrada: "bg-gray-100 text-gray-500",
};

// ============================================================
// Formatadores compartilhados
// ============================================================

/** "YYYY-MM-DD..." -> "DD/MM/YYYY" sem passar por Date (evita shift de fuso). */
export function formatDataCurta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

/** timestamptz/ISO -> "DD/MM/YYYY HH:MM" no fuso local. */
export function formatDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "01/01/2026 – 31/03/2026" | "01/01/2026 – aberto" | "Sem período". */
export function periodoLabel(
  inicio: string | null | undefined,
  fim: string | null | undefined,
): string {
  if (!inicio && !fim) return "Sem período definido";
  return `${inicio ? formatDataCurta(inicio) : "—"} – ${
    fim ? formatDataCurta(fim) : "aberto"
  }`;
}

export function formatBRL(value: number | string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumero(value: number | string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/** ROAS = receita gerada / gasto real. Retorna null quando não calculável. */
export function calcularRoas(
  receita: number | string | null | undefined,
  gasto: number | string | null | undefined,
): number | null {
  const r = typeof receita === "string" ? Number(receita) : receita ?? 0;
  const g = typeof gasto === "string" ? Number(gasto) : gasto ?? 0;
  if (!g || Number.isNaN(r) || Number.isNaN(g) || g <= 0) return null;
  return r / g;
}

/** CAC = gasto real / vendas. Retorna null quando não calculável. */
export function calcularCac(
  gasto: number | string | null | undefined,
  vendas: number | string | null | undefined,
): number | null {
  const g = typeof gasto === "string" ? Number(gasto) : gasto ?? 0;
  const v = typeof vendas === "string" ? Number(vendas) : vendas ?? 0;
  if (!v || Number.isNaN(g) || Number.isNaN(v) || v <= 0) return null;
  return g / v;
}

export function formatRoas(roas: number | null): string {
  return roas == null ? "—" : `${roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x`;
}

/** ISO/timestamptz -> valor de <input type="datetime-local"> (horário local). */
export function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
}

/** "YYYY-MM-DD..." | ISO -> valor de <input type="date">. */
export function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}
