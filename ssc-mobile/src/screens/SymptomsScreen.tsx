// ======================================================
// Registro de síntomas (src/screens/SymptomsScreen.tsx)
// El paciente registra cómo se siente cada día: síntomas
// (dolor, fiebre, sangrado, etc.), nivel de dolor 0–10 y
// observaciones. Se guarda vía POST /api/me/symptoms y se
// muestra el historial de reportes anteriores.
// ======================================================
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api, getErrorMessage } from '../api';
import { base, colors } from '../theme';
import { SYMPTOM_LABEL, SYMPTOM_OPTIONS, type SymptomReport } from '../types';

export default function SymptomsScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<SymptomReport[]>([]);

  const load = useCallback(async () => {
    try {
      setReports(await api.get<SymptomReport[]>('/api/me/symptoms'));
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  }

  async function submit() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await api.post('/api/me/symptoms', {
        symptoms: selected,
        painLevel,
        notes: notes || null,
      });
      setSelected([]);
      setPainLevel(0);
      setNotes('');
      setSaved(true);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={base.screen} contentContainerStyle={base.content}>
      <Text style={base.title}>¿Cómo te sentís hoy?</Text>
      <Text style={base.subtitle}>Marcá tus síntomas y tu nivel de dolor.</Text>

      {/* Selección de síntomas */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {SYMPTOM_OPTIONS.map((s) => {
          const active = selected.includes(s.value);
          return (
            <TouchableOpacity
              key={s.value}
              onPress={() => toggle(s.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? colors.brand : colors.card,
                borderWidth: 1,
                borderColor: active ? colors.brand : colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14 }}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Nivel de dolor 0-10 */}
      <Text style={[base.cardTitle, { marginTop: 12 }]}>Nivel de dolor: {painLevel}/10</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {Array.from({ length: 11 }, (_, n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setPainLevel(n)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: painLevel === n ? (n >= 8 ? colors.danger : colors.brand) : colors.card,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[base.input, { marginTop: 8 }]}
        placeholder="Observaciones (opcional)"
        placeholderTextColor={colors.textFaint}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {error && <Text style={base.error}>{error}</Text>}
      {saved && <Text style={{ color: colors.success, fontSize: 14 }}>✓ Síntomas registrados. ¡Gracias!</Text>}

      <TouchableOpacity
        style={[base.button, { opacity: selected.length === 0 || saving ? 0.5 : 1 }]}
        disabled={selected.length === 0 || saving}
        onPress={() => void submit()}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={base.buttonText}>Registrar síntomas</Text>}
      </TouchableOpacity>

      {/* Historial de reportes */}
      <Text style={[base.cardTitle, { marginTop: 20 }]}>Mis reportes anteriores</Text>
      {reports.length === 0 && <Text style={base.meta}>Todavía no registraste síntomas.</Text>}
      {reports.map((r) => (
        <View key={r.id} style={base.card}>
          <Text style={{ color: colors.text, fontSize: 14 }}>
            {r.symptoms.map((s) => SYMPTOM_LABEL[s] ?? s).join(' · ')}
          </Text>
          <Text style={[base.meta, { marginTop: 4 }]}>
            Dolor {r.painLevel}/10 · {new Date(r.reportedAt).toLocaleString()}
          </Text>
          {r.notes && <Text style={[base.meta, { marginTop: 2 }]}>{r.notes}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}
