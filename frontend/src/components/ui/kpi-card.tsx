// ======================================================
// KpiCard (components/ui/kpi-card.tsx)
// Métrica de la fila superior: nombre en gris, número grande
// y, opcionalmente, una línea de contexto. Sin íconos ni
// cajas internas: la cifra es la protagonista. La variante
// "danger" sólo tiñe el número (rosa desaturado) cuando hay
// algo que atender. También exporta ProgressBar.
// ======================================================
import type { ComponentType, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Skeleton } from "./skeleton";

type Tone = "navy" | "brand" | "success" | "warning" | "danger" | "info";

const VALUE_TONE: Record<Tone, string> = {
  navy: "text-slate-900",
  brand: "text-slate-900",
  success: "text-slate-900",
  warning: "text-amber-700",
  info: "text-slate-900",
  danger: "text-rose-600",
};

export function KpiCard({
  label,
  value,
  unit,
  tone = "navy",
  footer,
  loading,
}: {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  /** Se acepta por compatibilidad; ya no se muestra. */
  icon?: ComponentType<{ className?: string }>;
  tone?: Tone;
  footer?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-[0_1px_2px_rgb(15_23_42/0.03)]">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        {loading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <span className={cn("text-4xl font-semibold tracking-tight", VALUE_TONE[tone])}>{value}</span>
        )}
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {footer && <div className="mt-4 text-sm text-slate-400">{footer}</div>}
    </div>
  );
}

/** Barra de progreso fina (ocupación, checklist). */
export function ProgressBar({
  value,
  tone = "navy",
  className,
}: {
  value: number;
  tone?: "navy" | "success" | "warning" | "danger" | "brand";
  className?: string;
}) {
  const color = {
    navy: "bg-navy-600",
    brand: "bg-blue-500",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
  }[tone];
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
