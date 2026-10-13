// ======================================================
// TableCard / EmptyRow (components/ui/table.tsx)
// Envoltorio estándar de tablas (tarjeta blanca + scroll
// horizontal en mobile) y fila de fallback para listados
// vacíos. Usado por todas las páginas con tabla.
// ======================================================
import type { ReactNode } from "react";

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-8 py-16 text-center text-sm text-slate-400">
        {children}
      </td>
    </tr>
  );
}
