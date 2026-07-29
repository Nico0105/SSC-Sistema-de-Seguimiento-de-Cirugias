// ======================================================
// Tipos de dominio compartidos (lib/types.ts)
// Formas de los datos que devuelve la API, usadas por las
// páginas. Antes cada página redeclaraba sus propias
// interfaces parciales (duplicación y riesgo de divergencia).
// ======================================================
import type { SurgeryStatus } from "./surgery-status";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bloodType: string | null;
  allergies: string | null;
  notes: string | null;
}

export interface OperatingRoom {
  id: string;
  code: string;
  name: string;
  floor: string | null;
  active: boolean;
}

export interface Surgery {
  id: string;
  publicCode: string;
  procedure: string;
  surgeonName: string | null;
  status: SurgeryStatus;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  priority: string | null;
  notes: string | null;
  patient: Patient;
  operatingRoom: OperatingRoom | null;
}

/** Entrada del timeline de estados de una cirugía. */
export interface SurgeryHistoryEntry {
  id: string;
  status: SurgeryStatus;
  createdAt: string;
  note: string | null;
}

export interface SurgeryDetail extends Surgery {
  history: SurgeryHistoryEntry[];
}

export interface Appointment {
  id: string;
  scheduledAt: string;
  type: string;
  status: string;
  notes: string | null;
  patient: Patient;
}

/** Cirugía anonimizada que expone la pantalla pública de familiares. */
export interface BoardItem {
  id: string;
  publicCode: string;
  status: SurgeryStatus;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  operatingRoom: { code: string; name: string } | null;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  active: boolean;
  createdAt: string;
  roles: string[];
}
