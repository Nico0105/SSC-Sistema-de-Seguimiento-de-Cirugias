// ======================================================
// StatusBadge (components/ui/status-badge.tsx)
// Badge específico para el estado de una cirugía, sobre el
// Badge genérico. Los colores por estado siguen viviendo en
// lib/surgery-status.ts (única fuente de verdad del flujo
// quirúrgico) — acá sólo se decide el tamaño.
// ======================================================
import { STATUS_COLOR, STATUS_LABEL, type SurgeryStatus } from "../../lib/surgery-status";
import { cn } from "../../lib/cn";

export function StatusBadge({ status, size = "sm" }: { status: SurgeryStatus; size?: "sm" | "lg" }) {
  const sizeClasses = size === "lg" ? "px-4 py-2 text-base" : "px-2 py-1 text-xs";
  return (
    <span className={cn("inline-flex rounded-full font-medium", sizeClasses, STATUS_COLOR[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
