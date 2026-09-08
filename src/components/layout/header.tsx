"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { signOut } from "@/app/dashboard/actions";
import { getPageTitle } from "./nav";

type HeaderProps = {
  onMenuClick: () => void;
  userEmail: string;
  userInitials: string;
};

export function Header({ onMenuClick, userEmail, userInitials }: HeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-black/5 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menu"
        className="grid h-9 w-9 place-items-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="flex-1 truncate text-lg font-semibold text-gray-900">
        {title}
      </h1>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={userEmail}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#24483F] text-xs font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#24483F] focus:ring-offset-2"
        >
          {userInitials}
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-black/5 bg-white shadow-lg"
          >
            <div className="border-b border-black/5 px-4 py-3">
              <p className="truncate text-sm font-medium text-gray-900">
                {userEmail}
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
