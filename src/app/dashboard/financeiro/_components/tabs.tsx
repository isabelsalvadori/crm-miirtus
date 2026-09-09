"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/financeiro", label: "Visão Geral" },
  { href: "/dashboard/financeiro/receitas", label: "Receitas" },
  { href: "/dashboard/financeiro/despesas", label: "Despesas" },
  { href: "/dashboard/financeiro/a-receber", label: "A Receber" },
  { href: "/dashboard/financeiro/a-pagar", label: "A Pagar" },
  { href: "/dashboard/financeiro/fluxo-de-caixa", label: "Fluxo de Caixa" },
];

export function FinanceiroTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b border-black/5">
      <nav className="-mb-px flex flex-wrap gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-[#24483F] text-[#24483F]"
                  : "border-transparent text-gray-500 hover:border-black/10 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/dashboard/financeiro/categorias"
        className="mb-2 shrink-0 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        ⚙ Categorias
      </Link>
    </div>
  );
}
