// ======================================================
// Tablero público (src/screens/BoardScreen.tsx)
// Estado de las cirugías del día para FAMILIARES, sin login:
// consume /api/public/board (sólo códigos anónimos, nunca
// datos del paciente). Filtro por código, refresco cada 30 s
// y "tirar para refrescar".
// ======================================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { base, colors, statusInfo } from '../theme';
import type { BoardItem } from '../types';

const REFRESH_INTERVAL_MS = 30_000;

export default function BoardScreen() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<BoardItem[]>('/api/public/board'));
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Filtro por el código público que el familiar tiene en mano.
  const visible = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return items;
    return items.filter((i) => i.publicCode.toUpperCase().includes(q));
  }, [items, query]);

  return (
    <View style={base.screen}>
      <View style={{ padding: 20, paddingBottom: 8 }}>
        <Text style={base.title}>Cirugías de hoy</Text>
        <Text style={[base.subtitle, { marginBottom: 12 }]}>Seguimiento para familiares</Text>
        <TextInput
          style={base.input}
          placeholder="Buscar por código (ej. A-123)"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="characters"
          value={query}
          onChangeText={setQuery}
        />
        {error && <Text style={[base.error, { marginTop: 8 }]}>{error}</Text>}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        ListEmptyComponent={
          <Text style={base.empty}>
            {query ? 'No hay cirugías con ese código.' : 'No hay cirugías programadas para hoy.'}
          </Text>
        }
        renderItem={({ item }) => {
          const info = statusInfo(item.status, item.waitingRoom);
          return (
            <View style={base.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{item.publicCode}</Text>
                <View style={[base.badge, { backgroundColor: info.color }]}>
                  <Text style={base.badgeText}>{info.label}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                <Text style={base.meta}>Quirófano: {item.operatingRoom?.code ?? '—'}</Text>
                <Text style={base.meta}>
                  Programada:{' '}
                  {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
