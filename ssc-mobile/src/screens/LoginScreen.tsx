// ======================================================
// Pantalla de login (src/screens/LoginScreen.tsx)
// Autenticación con email y contraseña contra el backend
// (JWT). Al ingresar, la sesión queda persistida en el
// almacenamiento seguro del dispositivo y se registra el
// token de notificaciones push.
// ======================================================
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, getErrorMessage, type SessionUser } from '../api';
import { base, colors } from '../theme';

export default function LoginScreen({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      onLogin(await auth.login(email.trim(), password));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[base.screen, { justifyContent: 'center', padding: 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={[base.title, { fontSize: 32 }]}>SSC</Text>
      <Text style={[base.subtitle, { marginBottom: 24 }]}>
        Iniciá sesión para ver tu seguimiento
      </Text>

      <View style={{ gap: 12 }}>
        <TextInput
          style={base.input}
          placeholder="Email"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={base.input}
          placeholder="Contraseña"
          placeholderTextColor={colors.textFaint}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={base.error}>{error}</Text>}

        <TouchableOpacity style={base.button} onPress={() => void submit()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={base.buttonText}>Entrar</Text>}
        </TouchableOpacity>
      </View>

      <Text style={[base.meta, { textAlign: 'center', marginTop: 24 }]}>
        ¿No tenés cuenta? Pedila en la administración del hospital.
      </Text>
    </KeyboardAvoidingView>
  );
}
