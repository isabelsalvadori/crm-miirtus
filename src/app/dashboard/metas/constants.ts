/**
 * Opções, rótulos, badges e formatadores do módulo de Metas (tabela `metas`).
 */

type Opt = { value: string; label: string };

export const META_TIPO_OPTIONS: Opt[] = [
  { value: "corporativa", label: "Corporativa" },
  { value: "produto", label: "Produto" },
  { value: "projeto", label: "Projeto" },
  { value: "marketing", label: "Marketing" },
  { value: "financeira", label: "Financeira" },
  { value: "evento", label: "Evento" },
];

export const META_UNIDADE_OPTIONS: Opt[] = [
  { value: "R$", label: "R$ (moeda)" },
  { value: "unidades", label: "Unidades" },
  { value: "publicacoes", label: "Publicações" },
  { value: "inscritos", label: "Inscritos" },
  { value: "leads", label: "Leads" },
  { value: "outro", label: "Outro" },
];

export const META_STATUS_OPTIONS: Opt[] = [
  { value: "ativa", label: "Ativa" },
  { value: "concluida", label: "Concluída" },
  { value: "nao_atingida", label: "Não atingida" },
  { value: "arquivada", label: "Arquivada" },
];

const valores = (opts: Opt[]) => opts.map((o) => o.value);

export const META_TIPO_VALUES = valores(META_TIPO_OPTIONS);
export const META_UNIDADE_VALUES = valores(META_UNIDADE_OPTIONS);
export const META_STATUS_VALUES = valores(META_STATUS_OPTIONS);

function label(opts: Opt[], value: string | null | undefined, fallback = "—") {
  return opts.find((o) => o.value === value)?.label ?? fallback;
}

export const metaTipoLabel = (v: string | null | undefined) =>
  label(META_TIPO_OPTIONS, v, "Corporativa");
export const metaStatusLabel = (v: string | null | undefined) =>
  label(META_STATUS_OPTIONS, v, "Ativa");

/** Rótulo curto da unidade, usado ao lado dos números não-monetários. */
export function unidadeSufixo(v: string | null | undefined): string {
  switch (v) {
    case "unidades":
      return "un.";
    case "publicacoes":
      return "publicações";
    case "inscritos":
      return "inscritos";
    case "leads":
      return "leads";
    default:
      return "";
  }
}

export const META_TIPO_BADGE: Record<string, string> = {
  corporativa: "bg-[#24483F]/10 text-[#24483F]",
  produto: "bg-[#B97059]/15 text-[#B97059]",
  projeto: "bg-[#E3BD62]/25 text-[#2D3230]",
  marketing: "bg-violet-100 text-violet-700",
  financeira: "bg-emerald-100 text-emerald-700",
  evento: "bg-sky-100 text-sky-700",
};

export const META_STATUS_BADGE: Record<string, string> = {
  ativa: "bg-[#24483F]/10 text-[#24483F]",
  concluida: "bg-emerald-100 text-emerald-700",
  nao_atingida: "bg-red-100 text-red-700",
  arquivada: "bg-gray-100 text-gray-400",
};

/** Formata um valor conforme a unidade da meta (R$ pt-BR ou número + sufixo). */
export function formatValorMeta(
  value: number | string | null | undefined,
  unidade: string | null | undefined,
): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (Number.isNaN(n)) return unidade === "R$" ? "R$ 0,00" : "0";

  if (unidade === "R$") {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const num = n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const sufixo = unidadeSufixo(unidade);
  return sufixo ? `${num} ${sufixo}` : num;
}

/** Percentual de progresso (0–999), tolerante a alvo nulo/zero. */
export function percentualMeta(
  atual: number | string | null | undefined,
  alvo: number | string | null | undefined,
): number {
  const a = typeof atual === "string" ? Number(atual) : (atual ?? 0);
  const b = typeof alvo === "string" ? Number(alvo) : (alvo ?? 0);
  if (!b || Number.isNaN(a) || Number.isNaN(b) || b <= 0) return 0;
  return Math.round((a / b) * 100);
}

/** Verdadeiro quando o período da meta já terminou (fim no passado). */
export function periodoEncerrado(fim: string | null | undefined): boolean {
  if (!fim) return false;
  return fim.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

/**
 * Cor da barra de progresso:
 * - verde   ≥ 100%
 * - âmbar   ≥ 70%
 * - vermelho < 70% com período encerrado
 * - azul    em andamento (< 70%, período aberto)
 */
export function corBarraMeta(
  percentual: number,
  fim: string | null | undefined,
): { barra: string; texto: string } {
  if (percentual >= 100)
    return { barra: "bg-emerald-500", texto: "text-emerald-600" };
  if (percentual >= 70)
    return { barra: "bg-[#E3BD62]", texto: "text-[#a9822a]" };
  if (periodoEncerrado(fim))
    return { barra: "bg-red-500", texto: "text-red-600" };
  return { barra: "bg-sky-500", texto: "text-sky-600" };
}

export function formatDataCurta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** "01/01/2026 – 31/03/2026" ou "01/01/2026 – Contínua" ou "Sem período". */
export function periodoLabel(
  inicio: string | null | undefined,
  fim: string | null | undefined,
): string {
  if (!inicio && !fim) return "Sem período definido";
  return `${inicio ? formatDataCurta(inicio) : "—"} – ${
    fim ? formatDataCurta(fim) : "Contínua"
  }`;
}
