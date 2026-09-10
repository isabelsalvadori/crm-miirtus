import { createClient } from "@/lib/supabase/server";
import { carregarCatalogos, carregarConteudos } from "../db";
import { CalendarioEditorial } from "./components/CalendarioEditorial";

export default async function CalendarioPage() {
  const supabase = createClient();
  const [{ itens, error }, catalogos] = await Promise.all([
    carregarConteudos(supabase, { apenasComData: true }),
    carregarCatalogos(supabase),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
        Não foi possível carregar o calendário. Recarregue a página.
      </div>
    );
  }

  return <CalendarioEditorial conteudos={itens} catalogos={catalogos} />;
}
