// ======================================================
// BrandMark (components/layout/BrandMark.tsx)
// Logo de MediQ's: cuadrado con la cruz médica y el nombre.
// Se repite en el encabezado, el login y la pantalla pública.
// `inverted` lo adapta a fondos oscuros (barra superior azul).
// ======================================================
import { Plus } from "lucide-react";
import { cn } from "../../lib/cn";

export function BrandMark({
  subtitle,
  size = "md",
  inverted,
  hideNameOnMobile,
  className,
}: {
  subtitle?: string;
  size?: "md" | "lg";
  /** Versión clara para fondos oscuros. */
  inverted?: boolean;
  /** Muestra sólo el ícono en pantallas chicas (para hacer lugar a la navegación). */
  hideNameOnMobile?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-lg",
          inverted ? "bg-white text-navy-600" : "bg-navy-600 text-white",
          size === "lg" ? "h-11 w-11" : "h-8 w-8",
        )}
      >
        <Plus className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2.75} />
      </span>
      <span className={cn("leading-tight", hideNameOnMobile && "hidden md:block")}>
        <span
          className={cn(
            "block font-semibold tracking-tight",
            inverted ? "text-white" : "text-slate-900",
            size === "lg" ? "text-xl" : "text-base",
          )}
        >
          MediQ's
        </span>
        {subtitle && <span className={cn("block text-xs", inverted ? "text-white/60" : "text-slate-400")}>{subtitle}</span>}
      </span>
    </div>
  );
}
