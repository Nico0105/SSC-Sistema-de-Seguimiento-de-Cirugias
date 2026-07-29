// ======================================================
// SSC Mobile — App principal (App.tsx)
// Orquesta la sesión y la navegación de la app:
//   - Sin login: tablero público para familiares + acceso
//     al login del paciente.
//   - Con login (rol paciente): pestañas Mis cirugías
//     (con checklist), Síntomas, Seguimiento y Perfil.
// La sesión JWT se restaura y RENUEVA al abrir la app
// (expo-secure-store + POST /api/auth/refresh) y al
// iniciar sesión se registra el token de push (FCM).
// ======================================================
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { auth, type SessionUser } from './src/api';
import { registerMobilePush, unregisterMobilePush } from './src/push';
import { base, colors } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import BoardScreen from './src/screens/BoardScreen';
import SurgeriesScreen from './src/screens/SurgeriesScreen';
import SymptomsScreen from './src/screens/SymptomsScreen';
import PostopScreen from './src/screens/PostopScreen';
import ProfileScreen from './src/screens/ProfileScreen';

/** Pestañas disponibles según haya sesión o no. */
type Tab = 'board' | 'login' | 'surgeries' | 'symptoms' | 'postop' | 'profile';

const GUEST_TABS: { key: Tab; label: string }[] = [
  { key: 'board', label: 'Tablero' },
  { key: 'login', label: 'Ingresar' },
];

const PATIENT_TABS: { key: Tab; label: string }[] = [
  { key: 'surgeries', label: 'Cirugías' },
  { key: 'symptoms', label: 'Síntomas' },
  { key: 'postop', label: 'Seguimiento' },
  { key: 'profile', label: 'Perfil' },
];

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<Tab>('board');

  // Restauración (y renovación) de la sesión persistida al abrir la app.
  useEffect(() => {
    auth
      .restore()
      .then((restored) => {
        setUser(restored);
        if (restored) {
          setTab('surgeries');
          void registerMobilePush();
        }
      })
      .finally(() => setBooting(false));
  }, []);

  /** Login exitoso: registra push y entra al portal del paciente. */
  function handleLogin(logged: SessionUser) {
    setUser(logged);
    setTab('surgeries');
    void registerMobilePush();
  }

  /** Logout: da de baja el push y borra la sesión del dispositivo. */
  async function handleSignOut() {
    await unregisterMobilePush();
    await auth.signOut();
    setUser(null);
    setTab('board');
  }

  if (booting) {
    return (
      <View style={[base.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  const tabs = user ? PATIENT_TABS : GUEST_TABS;

  return (
    <SafeAreaView style={base.screen}>
      <StatusBar style="light" />

      {/* Contenido de la pestaña activa */}
      <View style={{ flex: 1 }}>
        {tab === 'board' && <BoardScreen />}
        {tab === 'login' && <LoginScreen onLogin={handleLogin} />}
        {tab === 'surgeries' && user && <SurgeriesScreen />}
        {tab === 'symptoms' && user && <SymptomsScreen />}
        {tab === 'postop' && user && <PostopScreen />}
        {tab === 'profile' && user && (
          <ProfileScreen user={user} onSignOut={() => void handleSignOut()} />
        )}
      </View>

      {/* Barra de pestañas */}
      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text
              style={{
                color: tab === t.key ? colors.brand : colors.textMuted,
                fontWeight: tab === t.key ? '700' : '400',
                fontSize: 14,
              }}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
