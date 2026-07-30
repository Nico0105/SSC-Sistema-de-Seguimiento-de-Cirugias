// ======================================================
// Card (components/ui/card.tsx)
// Contenedor blanco con borde redondeado: la unidad visual
// básica de toda la app (tarjetas del dashboard, paneles de
// detalle, formularios). Reemplaza el `Card` local de
// SurgeryDetail.tsx y el `Section` local de PatientHistory.tsx
// (eran casi idénticos, duplicados de forma independiente).
// ======================================================
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl", className)} {...props} />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-3 flex items-center justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-semibold text-slate-800", className)} {...props} />;
}

/** Subtítulo opcional bajo el título (ej. contador "3/6 completados"). */
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-slate-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
