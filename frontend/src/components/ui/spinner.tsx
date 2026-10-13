// ======================================================
// Loading (components/ui/spinner.tsx)
// Indicador de carga a página completa o dentro de un panel.
// Para tablas se prefiere TableSkeleton (skeleton.tsx), que
// da una idea de la forma del contenido; este spinner queda
// para cargas de página completa o botones.
// ======================================================
import { Loader2 } from "lucide-react";

export function Loading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="p-8 text-slate-500 flex items-center gap-3" role="status">
      <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
      {label}
    </div>
  );
}
