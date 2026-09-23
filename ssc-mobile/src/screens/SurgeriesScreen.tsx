// ======================================================
// Mis cirugías (src/screens/SurgeriesScreen.tsx)
// Pantalla del PACIENTE autenticado: lista sus cirugías con
// estado actual y permite desplegar el checklist preoperatorio
// de cada una (sólo visualización: lo marca el personal del
// hospital). Consume /api/me/*, que garantiza que sólo ve
// su propia información.
// ======================================================
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api, getErrorMessage } from '../api';
import { base, colors, statusInfo } from '../theme';
import type { ChecklistItem, OwnSurgery } from '../types';

export default function SurgeriesScreen() {
  const [surgeries, setSurgeries] = useState<OwnSurgery[]>([]);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSurgeries(await api.get<OwnSurgery[]>('/api/me/surgeries'));
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /** Despliega/oculta el checklist de una cirugía (carga perezosa). */
  async function toggleChecklist(surgeryId: string) {
    if (expanded === surgeryId) {
      setExpanded(null);
      return;
    }
    setExpanded(surgeryId);
    if (!checklists[surgeryId]) {
      try {
        const items = await api.get<ChecklistItem[]>(`/api/me/surgeries/${surgeryId}/checklist`);
        setChecklists((prev) => ({ ...prev, [surgeryId]: items }));
      } catch (e) {
        setError(getErrorMessage(e));
      }
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <ScrollView
      style={base.screen}
      contentContainerStyle={base.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <Text style={base.title}>Mis cirugías</Text>
      {error && <Text style={base.error}>{error}</Text>}
      {surgeries.length === 0 && <Text style={base.empty}>No tenés cirugías registradas.</Text>}

      {surgeries.map((s) => {
        const info = statusInfo(s.status, s.waitingRoom);
        const items = checklists[s.id];
        const isOpen = expanded === s.id;
        return (
          <View key={s.id} style={base.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[base.cardTitle, { flex: 1, marginRight: 8 }]}>{s.procedure}</Text>
              <View style={[base.badge, { backgroundColor: info.color }]}>
                <Text style={base.badgeText}>{info.label}</Text>
              </View>
            </View>
            <Text style={[base.meta, { marginTop: 6 }]}>
              {new Date(s.scheduledAt).toLocaleString()}
              {s.operatingRoom ? ` · Quirófano ${s.operatingRoom.code}` : ''}
            </Text>

            {/* Checklist preoperatorio (sólo lectura) */}
            <TouchableOpacity onPress={() => void toggleChecklist(s.id)}>
              <Text style={{ color: colors.brand, marginTop: 10, fontSize: 14, fontWeight: '600' }}>
                {isOpen ? 'Ocultar checklist ▲' : 'Ver checklist preoperatorio ▼'}
              </Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={{ marginTop: 10, gap: 6 }}>
                {!items && <Text style={base.meta}>Cargando…</Text>}
                {items && items.length === 0 && (
                  <Text style={base.meta}>Sin ítems de checklist para esta cirugía.</Text>
                )}
                {items?.map((item) => (
                  <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: item.checked ? colors.success : colors.textFaint, fontSize: 16 }}>
                      {item.checked ? '☑' : '☐'}
                    </Text>
                    <Text
                      style={{
                        color: item.checked ? colors.textMuted : colors.text,
                        fontSize: 14,
                        textDecorationLine: item.checked ? 'line-through' : 'none',
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
