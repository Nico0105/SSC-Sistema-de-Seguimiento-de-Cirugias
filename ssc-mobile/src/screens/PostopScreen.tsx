// ======================================================
// Mi seguimiento (src/screens/PostopScreen.tsx)
// Historial cronológico de los controles postoperatorios
// que el equipo médico cargó sobre las cirugías del paciente:
// estado, evolución, medicación indicada y observaciones.
// Sólo lectura (los controles los carga el personal clínico).
// ======================================================
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { api, getErrorMessage } from '../api';
import { base, colors } from '../theme';
import { POSTOP_STATUS_LABEL, type PostopRecord } from '../types';

/** Color del estado de cada control. */
const POSTOP_COLOR: Record<string, string> = {
  estable: '#0284c7',
  mejorando: '#059669',
  con_complicaciones: '#e11d48',
  alta: '#16a34a',
};

export default function PostopScreen() {
  const [records, setRecords] = useState<PostopRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRecords(await api.get<PostopRecord[]>('/api/me/postop'));
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={base.screen}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={base.title}>Mi seguimiento</Text>
        <Text style={base.subtitle}>Controles e indicaciones de tu equipo médico</Text>
        {error && <Text style={[base.error, { marginTop: 8 }]}>{error}</Text>}
      </View>

      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        ListEmptyComponent={
          <Text style={base.empty}>Todavía no hay controles cargados por tu equipo médico.</Text>
        }
        renderItem={({ item }) => (
          <View style={base.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={[base.badge, { backgroundColor: POSTOP_COLOR[item.status] ?? colors.textFaint }]}>
                <Text style={base.badgeText}>{POSTOP_STATUS_LABEL[item.status] ?? item.status}</Text>
              </View>
              <Text style={base.meta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            {item.surgery && <Text style={[base.meta, { marginTop: 6 }]}>{item.surgery.procedure}</Text>}
            {item.medication && (
              <Text style={{ color: colors.text, fontSize: 14, marginTop: 6 }}>
                💊 Medicación: {item.medication}
              </Text>
            )}
            {item.evolution && (
              <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>
                Evolución: {item.evolution}
              </Text>
            )}
            {item.observations && (
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>{item.observations}</Text>
            )}
            {!item.compliance && (
              <Text style={{ color: colors.warning, fontSize: 13, marginTop: 4 }}>
                ⚠ Se registró incumplimiento de indicaciones
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
}
