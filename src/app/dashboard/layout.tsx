import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FAB } from "@/components/layout/FAB";

/**
 * Deriva iniciais a partir do e-mail (parte antes do @).
 * "isabel.salvadori@..." -> "IS" | "isabel@..." -> "IS"
 */
function initialsFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  const tokens = localPart.split(/[.\-_+]+/).filter(Boolean);

  const raw =
    tokens.length >= 2
      ? `${tokens[0][0]}${tokens[1][0]}`
      : localPart.slice(0, 2);

  return raw.toUpperCase() || "?";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const email = user.email ?? "";

  return (
    <DashboardShell userEmail={email} userInitials={initialsFromEmail(email)}>
      {children}
      {/* Captura Rápida — botão flutuante global, fora do fluxo do conteúdo. */}
      <FAB />
    </DashboardShell>
  );
}
