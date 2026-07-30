// ======================================================
// Select (components/ui/select.tsx)
// Selector controlado con etiqueta. Se mantiene sobre el
// <select> nativo (accesible y simple) en vez de un
// Combobox de Radix: no hay listas largas que justifiquen
// búsqueda dentro del selector en este sistema.
// ======================================================
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { FIELD_CLASSES } from "./input";

export function Select({
  label,
  value,
  onChange,
  children,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={cn(FIELD_CLASSES, error && "border-danger-600")}
      >
        {children}
      </select>
      {error && <span className="text-xs text-danger-600 mt-1 block">{error}</span>}
    </label>
  );
}
