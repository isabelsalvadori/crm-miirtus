/**
 * Bloco pulsante genérico para telas de loading (skeleton screens).
 * Combine vários com className (largura/altura/arredondamento) para
 * aproximar o formato do conteúdo real da página.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-black/[0.06] ${className}`} />;
}
