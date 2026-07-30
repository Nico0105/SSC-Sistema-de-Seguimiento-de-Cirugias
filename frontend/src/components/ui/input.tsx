// ======================================================
// Input (components/ui/input.tsx)
// Campo de texto controlado con etiqueta. Mantiene la misma
// API (label/value/onChange) que la versión original en
// ui.tsx para no romper los formularios existentes; en la
// Fase 3 se migran a react-hook-form con validación Zod.
// ======================================================
import { cn } from "../../lib/cn";

const FIELD_CLASSES =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none " +
  "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white " +
  "placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

export function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  /** Mensaje de error inline (opcional, para validación de formulario). */
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className={cn(FIELD_CLASSES, error && "border-danger-600 focus:border-danger-600 focus:ring-danger-600/20")}
      />
      {error && <span className="text-xs text-danger-600 mt-1 block">{error}</span>}
    </label>
  );
}

export { FIELD_CLASSES };
