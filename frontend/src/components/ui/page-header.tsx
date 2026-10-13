// ======================================================
// PageHeader (components/ui/page-header.tsx)
// Encabezado de cada pantalla: título, una línea de contexto
// en gris y UNA acción principal a la derecha. Sin líneas
// divisorias: el espacio en blanco separa el encabezado del
// contenido. También exporta LivePill y Breadcrumbs.
// ======================================================
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";

export function PageHeader({
  title,
  tag,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  /** Indicador discreto junto al título (ej. <LivePill />). */
  tag?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {tag}
        </div>
        {description && <p className="mt-2 max-w-2xl text-base text-slate-500">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

/** Indicador "en vivo": un punto y una palabra, sin caja. */
export function LivePill({ label = "En vivo", live = true, className }: { label?: string; live?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-slate-500", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-emerald-500" : "bg-slate-300")} />
      {label}
    </span>
  );
}

/** Miga de pan: "Cirugías › MQ-0001". El último ítem no es link. */
export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-slate-700">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-600">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
