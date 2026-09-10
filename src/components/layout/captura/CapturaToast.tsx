"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CapturaToast({
  label,
  href,
  onClose,
}: {
  label: string;
  href: string;
  onClose: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const timer = setTimeout(onClose, 4000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      role="status"
      className={`fixed bottom-6 left-6 z-[70] flex items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 shadow-xl transition-all duration-200 ${
        show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <span className="text-sm font-medium text-[#2D3230]">✅ {label}</span>
      <Link
        href={href}
        onClick={onClose}
        className="text-sm font-semibold text-[#24483F] transition-colors hover:underline"
      >
        Ver →
      </Link>
    </div>
  );
}
