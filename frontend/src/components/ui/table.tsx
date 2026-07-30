// ======================================================
// TableCard / EmptyRow (components/ui/table.tsx)
// Envoltorio estándar de tablas (tarjeta blanca + scroll
// horizontal en mobile) y fila de fallback para listados
// vacíos. Usado por todas las páginas con tabla.
// ======================================================
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-14 text-center text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <Inbox className="h-6 w-6 text-slate-300" />
          <span>{children}</span>
        </div>
      </td>
    </tr>
  );
}
