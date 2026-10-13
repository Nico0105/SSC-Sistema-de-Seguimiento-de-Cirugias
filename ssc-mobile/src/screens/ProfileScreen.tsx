// ======================================================
// Perfil del paciente (src/screens/ProfileScreen.tsx)
// Datos personales del paciente vinculado a la cuenta
// (sólo lectura: los administra el hospital) y botón de
// cierre de sesión (borra el JWT del dispositivo y da de
// baja el token de notificaciones push).
// ======================================================
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api, getErrorMessage, type SessionUser } from '../api';
import { base, colors } from '../theme';
import type { OwnPatient } from '../types';

export default function ProfileScreen({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) {
  const [patient, setPatient] = useState<OwnPatient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPatient(await api.get<OwnPatient>('/api/me/patient'));
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <ScrollView style={base.screen} contentContainerStyle={base.content}>
      <Text style={base.title}>Mi perfil</Text>
      <Text style={base.subtitle}>{user.email}</Text>

      {error && <Text style={[base.error, { marginTop: 8 }]}>{error}</Text>}

      {patient && (
        <View style={[base.card, { marginTop: 8, gap: 6 }]}>
          <Row label="Nombre" value={`${patient.firstName} ${patient.lastName}`} />
          <Row label="Documento" value={patient.documentId} />
          {patient.birthDate && (
            <Row label="Nacimiento" value={new Date(patient.birthDate).toLocaleDateString()} />
          )}
          {patient.bloodType && <Row label="Grupo sanguíneo" value={patient.bloodType} />}
          {patient.phone && <Row label="Teléfono" value={patient.phone} />}
          {patient.email && <Row label="Email" value={patient.email} />}
          {patient.allergies && <Row label="Alergias" value={patient.allergies} warning />}
        </View>
      )}

      <Text style={[base.meta, { marginTop: 4 }]}>
        Si algún dato es incorrecto, avisá en la administración del hospital.
      </Text>

      <TouchableOpacity
        style={[base.button, { backgroundColor: colors.danger, marginTop: 16 }]}
        onPress={onSignOut}
      >
        <Text style={base.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/** Fila etiqueta/valor de la ficha del paciente. */
function Row({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={base.meta}>{label}</Text>
      <Text style={{ color: warning ? colors.warning : colors.text, fontSize: 14, flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}
