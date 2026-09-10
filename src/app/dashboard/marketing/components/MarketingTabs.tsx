"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MARKETING_TABS } from "../constants";

export function MarketingTabs() {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-black/10">
      {MARKETING_TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-[#E3BD62] text-[#24483F]"
                : "border-transparent text-gray-500 hover:border-black/15 hover:text-[#24483F]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
