// ======================================================
// Componentes de UI reutilizables (components/ui.tsx)
// Piezas visuales compartidas por todas las páginas:
// campos de formulario, badge de estado, botones, avisos
// de error y estados de carga/vacío para tablas.
// Antes cada página tenía su propia copia (código duplicado).
// ======================================================
import type { ReactNode } from "react";
import { STATUS_COLOR, STATUS_LABEL, type SurgeryStatus } from "../lib/surgery-status";

/** Clases base compartidas por inputs y selects. */
const FIELD_CLASSES =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none " +
  "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white";

/** Campo de texto controlado con su etiqueta. */
export function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
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
        className={FIELD_CLASSES}
      />
    </label>
  );
}

/** Selector controlado con su etiqueta; las opciones van como children. */
export function Select({
  label,
  value,
  onChange,
  children,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className={FIELD_CLASSES}>
        {children}
      </select>
    </label>
  );
}

/** Badge de color con el estado de una cirugía. */
export function StatusBadge({ status, size = "sm" }: { status: SurgeryStatus; size?: "sm" | "lg" }) {
  const sizeClasses = size === "lg" ? "px-4 py-2 text-base" : "px-2 py-1 text-xs";
  return (
    <span className={`rounded-full font-medium ${sizeClasses} ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Botón primario de la marca; muestra estado ocupado y evita doble submit. */
export function PrimaryButton({
  children,
  busy,
  disabled,
  onClick,
  type = "submit",
}: {
  children: ReactNode;
  busy?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy || disabled}
      className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition"
    >
      {busy ? "Guardando…" : children}
    </button>
  );
}

/** Aviso de error de formulario/operación (accesible para lectores de pantalla). */
export function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
      {message}
    </div>
  );
}

/** Indicador de carga a página completa o dentro de un panel. */
export function Loading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="p-8 text-slate-500 flex items-center gap-3" role="status">
      <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-brand-600 animate-spin" />
      {label}
    </div>
  );
}

/** Fila de tabla para listados vacíos. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10 text-center text-slate-400">
        {children}
      </td>
    </tr>
  );
}

/**
 * Contenedor estándar de tablas: tarjeta blanca con scroll horizontal
 * en pantallas chicas para no romper el layout responsive.
 */
export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
