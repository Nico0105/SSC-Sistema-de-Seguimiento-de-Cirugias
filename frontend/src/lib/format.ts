// ======================================================
// Formateo de fechas y datos de presentación (lib/format.ts)
// Helpers puros usados por las pantallas para mostrar horas
// ("08:30"), fechas, edades, iniciales y duraciones de forma
// consistente. Todo en locale es-AR.
// ======================================================

const LOCALE = "es-AR";

/** "08:30" */
export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

/** "24/10/2026" */
export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(LOCALE);
}

/** "24/10/2026 08:30" */
export function formatDateTime(value: string | Date): string {
  return `${formatDate(value)} ${formatTime(value)}`;
}

/** "Martes, 24 de octubre de 2026" (encabezados y reloj de la pantalla pública). */
export function formatLongDate(value: string | Date): string {
  const text = new Date(value).toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** true si la fecha cae en el día calendario de hoy (hora local). */
export function isToday(value: string | Date): boolean {
  return new Date(value).toDateString() === new Date().toDateString();
}

/** Edad en años a partir de la fecha de nacimiento (null si no hay dato). */
export function ageFrom(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Iniciales para avatares: "Mateo Rossi" → "MR". */
export function initials(...parts: (string | null | undefined)[]): string {
  return parts
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?";
}

/** Minutos transcurridos entre dos instantes (redondeado hacia abajo). */
export function minutesBetween(from: string | Date, to: string | Date = new Date()): number {
  return Math.max(0, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 60_000));
}

/** "1 h 15 min" / "42 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "Hace 4 min" / "Hace 2 h" / fecha, para feeds de actividad. */
export function formatRelative(value: string | Date, now: Date = new Date()): string {
  const mins = minutesBetween(value, now);
  if (mins < 1) return "Hace instantes";
  if (mins < 60) return `Hace ${mins} min`;
  if (mins < 24 * 60) return `Hace ${Math.floor(mins / 60)} h`;
  return formatDateTime(value);
}

/**
 * Código público para mostrar. Los códigos generados ("MQ-0004") se muestran
 * tal cual; los antiguos puramente numéricos llevan "#" ("#12").
 */
export function formatCode(code: string): string {
  return /^\d+$/.test(code) ? `#${code}` : code;
}
