export const STATUS_LABELS: Record<string, string> = {
  programada: "Programada",
  ingreso: "Ingreso",
  preparacion: "Preparación",
  en_quirofano: "En quirófano",
  recuperacion: "Recuperación",
  finalizada: "Finalizada",
  alta: "Alta",
  cancelada: "Cancelada",
};

export const STATUS_ORDER = [
  "programada",
  "ingreso",
  "preparacion",
  "en_quirofano",
  "recuperacion",
  "finalizada",
  "alta",
] as const;

export const STATUS_STYLES: Record<string, string> = {
  programada: "bg-muted text-muted-foreground border-border",
  ingreso: "bg-info/15 text-info border-info/30",
  preparacion: "bg-accent text-accent-foreground border-accent",
  en_quirofano: "bg-primary/15 text-primary border-primary/30",
  recuperacion: "bg-warning/20 text-warning-foreground border-warning/40",
  finalizada: "bg-success/15 text-success border-success/30",
  alta: "bg-success/25 text-success border-success/40",
  cancelada: "bg-destructive/15 text-destructive border-destructive/30",
};

export function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}
export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}
