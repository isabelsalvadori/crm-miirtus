import { createClient } from "@/lib/supabase/server";
import { carregarCatalogos, carregarDocumentos } from "../db";
import { AcervoList } from "./components/AcervoList";

export default async function BibliotecaAcervoPage() {
  const supabase = createClient();
  const [{ itens, error }, catalogos] = await Promise.all([
    carregarDocumentos(supabase, "biblioteca_acervo"),
    carregarCatalogos(supabase),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
        Não foi possível carregar o acervo. Recarregue a página.
      </div>
    );
  }

  return <AcervoList documentos={itens} catalogos={catalogos} />;
}
