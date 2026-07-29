// ======================================================
// SSC Mobile — Seguimiento para familiares (App.tsx)
// Primera versión de la app móvil: consume el endpoint
// público del backend (/api/public/board) y muestra el
// estado de las cirugías del día identificadas por su
// código público anónimo (sin datos del paciente).
//
// El familiar puede filtrar por el código que recibió al
// ingresar el paciente. La lista se refresca sola cada
// 30 segundos y manualmente con "tirar para refrescar".
// ======================================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// URL del backend. En un dispositivo físico debe ser la IP de la
// máquina que corre el backend (ej.: http://192.168.0.10:4000).
const API_URL = 'http://localhost:4000';

/** Frecuencia de refresco automático del tablero. */
const REFRESH_INTERVAL_MS = 30_000;

/** Estados posibles de una cirugía (deben coincidir con el backend). */
type SurgeryStatus =
  | 'programada'
  | 'ingreso'
  | 'preoperatorio'
  | 'en_quirofano'
  | 'recuperacion'
  | 'postoperatorio'
  | 'alta'
  | 'cancelada';

/** Etiqueta en español y color de badge para cada estado. */
const STATUS_INFO: Record<SurgeryStatus, { label: string; color: string }> = {
  programada: { label: 'Programada', color: '#64748b' },
  ingreso: { label: 'Ingreso', color: '#0284c7' },
  preoperatorio: { label: 'Preoperatorio', color: '#4f46e5' },
  en_quirofano: { label: 'En quirófano', color: '#d97706' },
  recuperacion: { label: 'Recuperación', color: '#7c3aed' },
  postoperatorio: { label: 'Postoperatorio', color: '#059669' },
  alta: { label: 'Alta', color: '#16a34a' },
  cancelada: { label: 'Cancelada', color: '#e11d48' },
};

/** Cirugía anonimizada tal como la expone la API pública. */
interface BoardItem {
  id: string;
  publicCode: string;
  status: SurgeryStatus;
  scheduledAt: string;
  operatingRoom: { code: string; name: string } | null;
}

export default function App() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Descarga el tablero del día desde la API pública. */
  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/public/board`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((await res.json()) as BoardItem[]);
      setError(null);
    } catch {
      setError('No se pudo conectar con el servidor. Reintentando…');
    }
  }, []);

  // Carga inicial + refresco automático periódico.
  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [load]);

  /** Gesto "tirar para refrescar" de la lista. */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Filtro por código público (lo que el familiar tiene en mano).
  const visible = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return items;
    return items.filter((i) => i.publicCode.toUpperCase().includes(q));
  }, [items, query]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>SSC — Seguimiento</Text>
        <Text style={styles.subtitle}>Estado de cirugías del día</Text>
        <TextInput
          style={styles.search}
          placeholder="Buscar por código (ej. A-123)"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
          value={query}
          onChangeText={setQuery}
        />
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query ? 'No hay cirugías con ese código.' : 'No hay cirugías programadas para hoy.'}
          </Text>
        }
        renderItem={({ item }) => {
          const info = STATUS_INFO[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.code}>{item.publicCode}</Text>
                <View style={[styles.badge, { backgroundColor: info.color }]}>
                  <Text style={styles.badgeText}>{info.label}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.meta}>
                  Quirófano: {item.operatingRoom?.code ?? '—'}
                </Text>
                <Text style={styles.meta}>
                  Programada:{' '}
                  {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingBottom: 12 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 2, marginBottom: 12 },
  search: {
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  error: { color: '#fbbf24', marginTop: 8, fontSize: 13 },
  list: { padding: 20, paddingTop: 8, gap: 12 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { color: '#fff', fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', gap: 16, marginTop: 12 },
  meta: { color: '#94a3b8', fontSize: 13 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 15 },
});
