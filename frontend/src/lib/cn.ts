// ======================================================
// Combinador de clases Tailwind (lib/cn.ts)
// Convención estándar de shadcn/ui: `clsx` arma la cadena
// de clases condicionales y `twMerge` resuelve conflictos
// (ej. si un componente base trae "px-4" y el caller pasa
// "px-2", gana la última sin dejar las dos aplicadas).
// Se usa en TODOS los componentes de components/ui/*.
// ======================================================
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
