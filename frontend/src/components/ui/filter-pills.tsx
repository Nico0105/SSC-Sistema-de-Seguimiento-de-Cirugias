// ======================================================
// FilterPills (components/ui/filter-pills.tsx)
// Filtro rápido como pestañas de texto: la opción activa se
// marca con un fondo gris suave, el resto es texto en gris.
// El contador va al lado, también en gris.
// ======================================================
import { cn } from "../../lib/cn";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  /** Se acepta por compatibilidad; ya no se muestra. */
  dot?: string;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel = "Filtrar",
}: {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("flex flex-wrap items-center gap-1", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-500 hover:text-slate-800",
            )}
          >
            {opt.label}
            {opt.count !== undefined && <span className="ml-1.5 text-slate-400">{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
