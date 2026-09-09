"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Banner de sucesso efêmero, alimentado pelo parâmetro `?ok=`.
 * Ao expirar, limpa o parâmetro da URL.
 */
export function Toast({ message }: { message: string | null }) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setVisible(false);
      router.replace(pathname, { scroll: false });
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, router, pathname]);

  if (!message || !visible) return null;

  return (
    <div
      role="status"
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800"
    >
      {message}
    </div>
  );
}
