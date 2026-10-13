// ======================================================
// StatusBadge (components/ui/status-badge.tsx)
// Estado de una cirugía: punto de color + texto, sobre un
// fondo pastel desaturado (sin borde). El tono de cada estado
// vive en lib/surgery-status.ts; acá sólo se decide el tamaño.
// ======================================================
import { STATUS_TONE, statusText, type SurgeryStatus } from "../../lib/surgery-status";
import { cn } from "../../lib/cn";

/** `waitingRoom` completa la etiqueta: "Esperando en sala 3". */
export function StatusBadge({
  status,
  waitingRoom,
  size = "sm",
  className,
}: {
  status: SurgeryStatus;
  waitingRoom?: string | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium",
        size === "lg" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs",
        tone.pill,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {statusText(status, waitingRoom)}
    </span>
  );
}
