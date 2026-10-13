// ======================================================
// Piezas de identificación (components/ui/identity.tsx)
//   - CodeChip: código de seguimiento ("MQ-0004") en
//     monoespaciada, como texto, sin caja.
//   - RoomChip: código de quirófano ("Q2") en monoespaciada.
//   - Avatar: iniciales sobre un gris neutro.
// ======================================================
import { cn } from "../../lib/cn";
import { formatCode, initials } from "../../lib/format";

export function CodeChip({ code, size = "sm", className }: { code: string; size?: "sm" | "lg"; className?: string }) {
  return (
    <span className={cn("font-mono font-medium text-slate-700", size === "lg" ? "text-lg" : "text-sm", className)}>
      {formatCode(code)}
    </span>
  );
}

export function RoomChip({ code, className }: { code: string | null | undefined; className?: string }) {
  if (!code) return <span className="text-slate-300">—</span>;
  return <span className={cn("font-mono text-sm text-slate-600", className)}>{code}</span>;
}

export function Avatar({
  name,
  size = "md",
  square,
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  square?: boolean;
  className?: string;
}) {
  const sizes = { sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-base" }[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-slate-100 font-semibold text-slate-600",
        square ? "rounded-xl" : "rounded-full",
        sizes,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
