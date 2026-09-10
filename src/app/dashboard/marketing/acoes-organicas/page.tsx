import { createClient } from "@/lib/supabase/server";
import { carregarAcoesOrganicas, carregarCatalogos } from "../db";
import { AcoesOrganicasList } from "./components/AcoesOrganicasList";

export default async function AcoesOrganicasPage() {
  const supabase = createClient();
  const [{ itens, error }, catalogos] = await Promise.all([
    carregarAcoesOrganicas(supabase),
    carregarCatalogos(supabase),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
        Não foi possível carregar as ações orgânicas. Recarregue a página.
      </div>
    );
  }

  return <AcoesOrganicasList acoes={itens} catalogos={catalogos} />;
}
