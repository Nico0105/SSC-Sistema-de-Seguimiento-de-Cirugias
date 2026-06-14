export const SURGERY_STATUSES = [
  "programada",
  "ingreso",
  "preoperatorio",
  "en_quirofano",
  "recuperacion",
  "postoperatorio",
  "alta",
  "cancelada",
] as const;

export type SurgeryStatus = (typeof SURGERY_STATUSES)[number];

export const STATUS_LABEL: Record<SurgeryStatus, string> = {
  programada: "Programada",
  ingreso: "Ingreso",
  preoperatorio: "Preoperatorio",
  en_quirofano: "En quirófano",
  recuperacion: "Recuperación",
  postoperatorio: "Postoperatorio",
  alta: "Alta",
  cancelada: "Cancelada",
};

export const STATUS_COLOR: Record<SurgeryStatus, string> = {
  programada: "bg-slate-100 text-slate-700",
  ingreso: "bg-sky-100 text-sky-700",
  preoperatorio: "bg-indigo-100 text-indigo-700",
  en_quirofano: "bg-amber-100 text-amber-800",
  recuperacion: "bg-violet-100 text-violet-700",
  postoperatorio: "bg-emerald-100 text-emerald-700",
  alta: "bg-green-100 text-green-700",
  cancelada: "bg-rose-100 text-rose-700",
};
