// ======================================================
// Card (components/ui/card.tsx)
// Superficie blanca sin borde marcado (borde hiperfino y
// sombra casi imperceptible) sobre el fondo gris neutro: la
// separación entre bloques la da el espacio, no las líneas.
// CardHeader: título + descripción opcional + UNA acción.
// ======================================================
import type { ComponentType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-slate-100 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.03)]", className)}
      {...props}
    />
  );
}

/** Encabezado de panel: título/descripción a la izquierda, acción a la derecha. */
export function CardHeader({
  className,
  title,
  description,
  actions,
  children,
  icon: _icon,
  ...rest
}: Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** Se acepta por compatibilidad, pero ya no se muestra (menos ruido visual). */
  icon?: ComponentType<{ className?: string }>;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  if (title === undefined) {
    return <div className={cn("px-8 pt-7 pb-4 flex items-center justify-between gap-4", className)} {...rest}>{children}</div>;
  }
  return (
    <div className={cn("px-8 pt-7 pb-4 flex items-start justify-between gap-4", className)} {...rest}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-semibold text-slate-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-8 pb-8", className)} {...props} />;
}
