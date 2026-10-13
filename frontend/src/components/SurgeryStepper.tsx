// ======================================================
// Etapas de la cirugía (components/SurgeryStepper.tsx)
// El flujo quirúrgico como una línea de puntos: los pasos
// recorridos en azul con su hora real (del historial), el
// actual resaltado y los futuros en gris claro.
// ======================================================
import { FLOW_STEPS, STATUS_LABEL, type SurgeryStatus } from "../lib/surgery-status";
import { formatTime } from "../lib/format";
import { cn } from "../lib/cn";
import type { SurgeryHistoryEntry } from "../lib/types";

export function SurgeryStepper({
  status,
  history,
  scheduledAt,
}: {
  status: SurgeryStatus;
  history: SurgeryHistoryEntry[];
  scheduledAt: string;
}) {
  if (status === "cancelada") {
    return <p className="text-sm text-rose-600">Cirugía cancelada. No admite más cambios de estado.</p>;
  }

  const currentIndex = FLOW_STEPS.indexOf(status);
  /** Hora en que la cirugía entró a cada estado (la entrada más antigua del historial). */
  const reachedAt = (step: SurgeryStatus) => {
    const entries = history.filter((h) => h.status === step);
    return entries.length ? entries[entries.length - 1]!.createdAt : null;
  };

  return (
    <ol className="grid grid-cols-1 gap-5 sm:grid-cols-5 sm:gap-0">
      {FLOW_STEPS.map((step, i) => {
        const reached = i <= currentIndex;
        const current = i === currentIndex;
        const time = step === "programada" ? reachedAt(step) ?? scheduledAt : reachedAt(step);
        return (
          <li key={step} className="relative flex items-center gap-3 sm:block">
            {i < FLOW_STEPS.length - 1 && (
              <span
                className={cn("absolute left-3 top-1.5 hidden h-px w-full sm:block", i < currentIndex ? "bg-navy-600" : "bg-slate-200")}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 block h-3 w-3 shrink-0 rounded-full",
                current ? "bg-navy-600 ring-4 ring-navy-100" : reached ? "bg-navy-600" : "bg-slate-200",
              )}
            />
            <div className="sm:mt-4">
              <p className={cn("text-sm", current ? "font-medium text-slate-900" : reached ? "text-slate-700" : "text-slate-400")}>
                {STATUS_LABEL[step]}
              </p>
              <p className="font-mono text-xs text-slate-400">{reached && time ? formatTime(time) : " "}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
