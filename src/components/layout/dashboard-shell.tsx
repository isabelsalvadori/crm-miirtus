"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

type DashboardShellProps = {
  children: ReactNode;
  userEmail: string;
  userInitials: string;
};

export function DashboardShell({
  children,
  userEmail,
  userInitials,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o drawer sempre que a rota muda.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Trava o scroll do body enquanto o drawer estiver aberto.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F1E8]">
      {/* Sidebar fixa — desktop */}
      <aside className="hidden shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Drawer — mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="absolute -right-11 top-3 grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Coluna de conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setMobileOpen(true)}
          userEmail={userEmail}
          userInitials={userInitials}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
