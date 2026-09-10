import { createClient } from "@/lib/supabase/server";
import { carregarCampanhas, carregarCatalogos } from "../db";
import { CampanhasList } from "./components/CampanhasList";

export default async function CampanhasPage() {
  const supabase = createClient();
  const [{ itens, error }, catalogos] = await Promise.all([
    carregarCampanhas(supabase),
    carregarCatalogos(supabase),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
        Não foi possível carregar as campanhas. Recarregue a página.
      </div>
    );
  }

  return <CampanhasList campanhas={itens} catalogos={catalogos} />;
}
