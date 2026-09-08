import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardPage() {
  // Defesa em profundidade: o middleware já protege a rota, mas garantimos
  // que nenhuma renderização aconteça sem um usuário válido.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#24483F] px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-white">MIIRTUS OS</h1>

      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#24483F] shadow-md transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#24483F]"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
