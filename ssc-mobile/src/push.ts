// ======================================================
// Notificaciones push móviles (src/push.ts)
// Registra el dispositivo en Firebase Cloud Messaging:
//   1. Pide permiso de notificaciones al usuario.
//   2. Obtiene el token NATIVO del dispositivo (en Android es
//      directamente un token FCM; requiere google-services.json
//      en el build nativo — ver docs/NOTIFICACIONES.md).
//   3. Lo registra en el backend (POST /api/fcm-tokens) para
//      que éste pueda enviar avisos (cambios de estado,
//      seguimientos, recordatorios, alta).
// En Expo Go el token nativo puede no estar disponible: el
// registro falla de forma silenciosa y la app sigue normal.
// ======================================================
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from './api';

let registeredToken: string | null = null;

// Mostrar la notificación aunque la app esté abierta en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Pide permiso, obtiene el token FCM del dispositivo y lo registra. */
export async function registerMobilePush(): Promise<void> {
  try {
    // Cast local: el tipo PermissionResponse no se resuelve con esta
    // combinación de versiones de Expo, pero el shape es estable.
    const permission = (await Notifications.requestPermissionsAsync()) as unknown as {
      granted: boolean;
      status: string;
    };
    if (!permission.granted && permission.status !== 'granted') return;

    if (Platform.OS === 'android') {
      // Canal por defecto requerido por Android 8+.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notificaciones SSC',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (!token) return;

    await api.post('/api/fcm-tokens', {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    registeredToken = token;
  } catch (error) {
    // Sin proyecto Firebase configurado (ej. Expo Go) el push no está
    // disponible: no es un error para el usuario.
    console.warn('[push] registro no disponible:', error);
  }
}

/** Da de baja el token al cerrar sesión (deja de recibir avisos). */
export async function unregisterMobilePush(): Promise<void> {
  if (!registeredToken) return;
  try {
    await api.delete('/api/fcm-tokens', { token: registeredToken });
  } catch {
    // El backend limpia tokens inválidos automáticamente.
  }
  registeredToken = null;
}
