// ======================================================
// Catálogo de síntomas (lib/symptoms.ts)
// Síntomas reportables definidos por la documentación
// funcional, con su etiqueta visible. Debe coincidir con
// el enum validado por el backend (routes/symptoms.ts).
// ======================================================

export const SYMPTOM_OPTIONS = [
  { value: "dolor", label: "Dolor" },
  { value: "ardor", label: "Ardor" },
  { value: "vision_borrosa", label: "Visión borrosa" },
  { value: "fiebre", label: "Fiebre" },
  { value: "inflamacion", label: "Inflamación" },
  { value: "sangrado", label: "Sangrado" },
  { value: "otros", label: "Otros" },
] as const;

export type SymptomValue = (typeof SYMPTOM_OPTIONS)[number]["value"];

/** Mapa valor → etiqueta para mostrar reportes existentes. */
export const SYMPTOM_LABEL: Record<string, string> = Object.fromEntries(
  SYMPTOM_OPTIONS.map((s) => [s.value, s.label]),
);

/** Estados de un control postoperatorio con su etiqueta. */
export const POSTOP_STATUS_OPTIONS = [
  { value: "estable", label: "Estable" },
  { value: "mejorando", label: "Mejorando" },
  { value: "con_complicaciones", label: "Con complicaciones" },
  { value: "alta", label: "Alta" },
] as const;

export const POSTOP_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  POSTOP_STATUS_OPTIONS.map((s) => [s.value, s.label]),
);
