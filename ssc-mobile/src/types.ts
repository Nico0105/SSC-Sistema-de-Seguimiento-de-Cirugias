// ======================================================
// Tipos de dominio de la app móvil (src/types.ts)
// Formas de los datos que devuelve la API del SSC.
// ======================================================

export interface OwnPatient {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  bloodType: string | null;
  allergies: string | null;
}

export interface OwnSurgery {
  id: string;
  publicCode: string;
  procedure: string;
  status: string;
  scheduledAt: string;
  waitingRoom: string | null;
  operatingRoom: { code: string; name: string } | null;
  history: { id: string; status: string; createdAt: string }[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  checkedAt: string | null;
}

export interface PostopRecord {
  id: string;
  status: string;
  evolution: string | null;
  medication: string | null;
  compliance: boolean;
  observations: string | null;
  createdAt: string;
  surgery?: { procedure: string; publicCode: string };
}

export interface SymptomReport {
  id: string;
  symptoms: string[];
  painLevel: number;
  notes: string | null;
  reportedAt: string;
}

/** Cirugía anonimizada del tablero público (pantalla sin login). */
export interface BoardItem {
  id: string;
  publicCode: string;
  status: string;
  scheduledAt: string;
  waitingRoom: string | null;
  operatingRoom: { code: string; name: string } | null;
}

/** Catálogo de síntomas (espejo del backend). */
export const SYMPTOM_OPTIONS = [
  { value: 'dolor', label: 'Dolor' },
  { value: 'ardor', label: 'Ardor' },
  { value: 'vision_borrosa', label: 'Visión borrosa' },
  { value: 'fiebre', label: 'Fiebre' },
  { value: 'inflamacion', label: 'Inflamación' },
  { value: 'sangrado', label: 'Sangrado' },
  { value: 'otros', label: 'Otros' },
] as const;

export const SYMPTOM_LABEL: Record<string, string> = Object.fromEntries(
  SYMPTOM_OPTIONS.map((s) => [s.value, s.label]),
);

export const POSTOP_STATUS_LABEL: Record<string, string> = {
  estable: 'Estable',
  mejorando: 'Mejorando',
  con_complicaciones: 'Con complicaciones',
  alta: 'Alta',
};
