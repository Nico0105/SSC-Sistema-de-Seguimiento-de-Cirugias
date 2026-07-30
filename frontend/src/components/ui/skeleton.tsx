// ======================================================
// Skeleton (components/ui/skeleton.tsx)
// Placeholder de carga (efecto "shimmer" con animate-pulse
// de Tailwind, sin dependencias nuevas). Reemplaza el
// spinner de texto ("Cargando…") en tablas y tarjetas: el
// usuario ve la forma del contenido antes de que llegue.
// ======================================================
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} {...props} />;
}

/** Placeholder de N filas de tabla, para usar dentro de un <tbody>. */
export function TableSkeleton({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-slate-100">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-6 py-4">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
