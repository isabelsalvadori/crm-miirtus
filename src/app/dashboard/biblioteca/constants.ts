/**
 * Opções, rótulos, badges e helpers do módulo de Biblioteca
 * (tabela `documentos`, separada por `entidade_tipo`).
 */

import type { EntidadeBiblioteca } from "./types";

export type Opt = { value: string; label: string };

const valores = (opts: Opt[]) => opts.map((o) => o.value);
function label(opts: Opt[], value: string | null | undefined, fallback = "—") {
  return opts.find((o) => o.value === value)?.label ?? fallback;
}

// ============================================================
// Abas
// ============================================================

export const BIBLIOTECA_TABS = [
  { href: "/dashboard/biblioteca/produtos", label: "Produtos" },
  { href: "/dashboard/biblioteca/estudos", label: "Estudos" },
  { href: "/dashboard/biblioteca/acervo", label: "Acervo" },
] as const;

export const ENTIDADE_POR_ABA: Record<string, EntidadeBiblioteca> = {
  produtos: "biblioteca_produto",
  estudos: "biblioteca_estudo",
  acervo: "biblioteca_acervo",
};

export const ABA_POR_ENTIDADE: Record<EntidadeBiblioteca, string> = {
  biblioteca_produto: "produtos",
  biblioteca_estudo: "estudos",
  biblioteca_acervo: "acervo",
};

// ============================================================
// Produtos
// ============================================================

export const PRODUTO_TIPO_OPTIONS: Opt[] = [
  { value: "persona", label: "Persona" },
  { value: "landing_page", label: "Landing Page" },
  { value: "pesquisa", label: "Pesquisa" },
  { value: "identidade", label: "Identidade" },
  { value: "roteiro", label: "Roteiro" },
  { value: "material", label: "Material" },
  { value: "playbook", label: "Playbook" },
  { value: "outro", label: "Outro" },
];

export const PRODUTO_TIPO_VALUES = valores(PRODUTO_TIPO_OPTIONS);
export const produtoTipoLabel = (v: string | null | undefined) =>
  label(PRODUTO_TIPO_OPTIONS, v, "Outro");

export const PRODUTO_TIPO_BADGE: Record<string, string> = {
  persona: "bg-[#24483F]/10 text-[#24483F]",
  landing_page: "bg-sky-100 text-sky-700",
  pesquisa: "bg-violet-100 text-violet-700",
  identidade: "bg-[#B97059]/15 text-[#B97059]",
  roteiro: "bg-amber-100 text-amber-700",
  material: "bg-emerald-100 text-emerald-700",
  playbook: "bg-[#E3BD62]/25 text-[#2D3230]",
  outro: "bg-black/5 text-gray-600",
};

// ============================================================
// Estudos
// ============================================================

export const ESTUDO_TIPO_OPTIONS: Opt[] = [
  { value: "artigo", label: "Artigo" },
  { value: "pdf", label: "PDF" },
  { value: "livro", label: "Livro" },
  { value: "pesquisa", label: "Pesquisa" },
  { value: "aula", label: "Aula" },
  { value: "curso", label: "Curso" },
  { value: "video", label: "Vídeo" },
  { value: "estudo", label: "Estudo" },
];

export const ESTUDO_TIPO_VALUES = valores(ESTUDO_TIPO_OPTIONS);
export const estudoTipoLabel = (v: string | null | undefined) =>
  label(ESTUDO_TIPO_OPTIONS, v, "Estudo");

export const ESTUDO_TIPO_BADGE: Record<string, string> = {
  artigo: "bg-sky-100 text-sky-700",
  pdf: "bg-red-100 text-red-700",
  livro: "bg-[#B97059]/15 text-[#B97059]",
  pesquisa: "bg-violet-100 text-violet-700",
  aula: "bg-amber-100 text-amber-700",
  curso: "bg-emerald-100 text-emerald-700",
  video: "bg-[#E3BD62]/25 text-[#2D3230]",
  estudo: "bg-[#24483F]/10 text-[#24483F]",
};

// ============================================================
// Acervo
// ============================================================

export const ACERVO_TIPO_OPTIONS: Opt[] = [
  { value: "link", label: "Link" },
  { value: "site", label: "Site" },
  { value: "ferramenta", label: "Ferramenta" },
  { value: "perfil", label: "Perfil" },
  { value: "inspiracao", label: "Inspiração" },
  { value: "referencia_visual", label: "Referência Visual" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "outro", label: "Outro" },
];

export const ACERVO_TIPO_VALUES = valores(ACERVO_TIPO_OPTIONS);
export const acervoTipoLabel = (v: string | null | undefined) =>
  label(ACERVO_TIPO_OPTIONS, v, "Outro");

export const ACERVO_TIPO_BADGE: Record<string, string> = {
  link: "bg-[#24483F]/10 text-[#24483F]",
  site: "bg-sky-100 text-sky-700",
  ferramenta: "bg-emerald-100 text-emerald-700",
  perfil: "bg-violet-100 text-violet-700",
  inspiracao: "bg-[#E3BD62]/25 text-[#2D3230]",
  referencia_visual: "bg-pink-100 text-pink-700",
  fornecedor: "bg-amber-100 text-amber-700",
  outro: "bg-black/5 text-gray-600",
};

// ============================================================
// Tags
// ============================================================

export const TAG_COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#B97059",
  "#E3BD62",
  "#24483F",
];

export function randomTagColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

export function tagTextColor(hex: string | null | undefined): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "#111827";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#111827" : "#ffffff";
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ============================================================
// Genéricos
// ============================================================

/** Texto de exibição curto para um link (domínio). */
export function dominioDe(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

export function truncar(texto: string | null | undefined, max = 140): string {
  if (!texto) return "";
  return texto.length > max ? `${texto.slice(0, max).trimEnd()}…` : texto;
}
