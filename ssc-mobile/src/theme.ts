// ======================================================
// Tema visual de la app (src/theme.ts)
// Paleta y estilos base compartidos por todas las pantallas
// (misma identidad oscura que la pantalla pública web).
// ======================================================
import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#0f172a',        // fondo general (slate-900)
  card: '#1e293b',      // tarjetas (slate-800)
  border: '#334155',    // bordes (slate-700)
  text: '#ffffff',
  textMuted: '#94a3b8', // slate-400
  textFaint: '#64748b', // slate-500
  brand: '#2563eb',     // azul de marca (brand-600)
  danger: '#e11d48',
  warning: '#fbbf24',
  success: '#16a34a',
};

/** Etiqueta y color de cada estado de cirugía (espejo del backend). */
export const STATUS_INFO: Record<string, { label: string; color: string }> = {
  programada: { label: 'Programada', color: '#64748b' },
  ingreso: { label: 'Ingreso', color: '#0284c7' },
  preoperatorio: { label: 'Preoperatorio', color: '#4f46e5' },
  en_quirofano: { label: 'En quirófano', color: '#d97706' },
  recuperacion: { label: 'Recuperación', color: '#7c3aed' },
  postoperatorio: { label: 'Postoperatorio', color: '#059669' },
  alta: { label: 'Alta', color: '#16a34a' },
  cancelada: { label: 'Cancelada', color: '#e11d48' },
};

/** Estilos base reutilizados por todas las pantallas. */
export const base = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 12 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 13 },
  error: { color: colors.warning, fontSize: 13 },
  empty: { color: colors.textFaint, textAlign: 'center', marginTop: 32, fontSize: 15 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '600' },
});
