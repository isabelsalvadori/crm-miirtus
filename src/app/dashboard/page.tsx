/**
 * Placeholder de "Início". O guard de autenticação e o layout (sidebar +
 * header) vivem em src/app/dashboard/layout.tsx.
 */
export default function InicioPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-xl font-semibold text-[#24483F]">
        Bem-vinda ao MIIRTUS OS
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Este é o painel de Início. Os módulos vão aparecer aqui conforme forem
        construídos.
      </p>

      <div className="mt-6 rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Nada por aqui ainda.</p>
      </div>
    </div>
  );
}
