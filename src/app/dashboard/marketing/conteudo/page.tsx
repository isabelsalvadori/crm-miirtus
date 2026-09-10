import { createClient } from "@/lib/supabase/server";
import { carregarCatalogos, carregarConteudos } from "../db";
import { ConteudoKanban } from "./components/ConteudoKanban";

export default async function ConteudoPage() {
  const supabase = createClient();
  const [{ itens, error }, catalogos] = await Promise.all([
    carregarConteudos(supabase),
    carregarCatalogos(supabase),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
        Não foi possível carregar os conteúdos. Recarregue a página.
      </div>
    );
  }

  return <ConteudoKanban conteudos={itens} catalogos={catalogos} />;
}
