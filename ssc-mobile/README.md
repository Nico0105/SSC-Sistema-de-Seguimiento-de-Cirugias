# SSC Mobile — React Native + Expo

App móvil del Sistema de Seguimiento de Cirugías. Dos modos de uso:

- **Sin login (familiares)**: tablero público con el estado de las cirugías del
  día, identificadas sólo por su código anónimo. Filtro por código, refresco
  automático y pull-to-refresh.
- **Con login (rol paciente)**: portal de autogestión con
  - **Mis cirugías** — estado en vivo + checklist preoperatorio (sólo lectura)
  - **Síntomas** — registro diario (síntomas, dolor 0–10, observaciones) e historial
  - **Seguimiento** — controles e indicaciones cargados por el equipo médico
  - **Perfil** — datos personales y cierre de sesión

## Autenticación

- Login con email/contraseña contra `POST /api/auth/login` (JWT).
- La sesión se **persiste cifrada** en el dispositivo (`expo-secure-store`).
- Al abrir la app el token se **renueva** (`POST /api/auth/refresh`); si venció,
  se vuelve al login.
- Al cerrar sesión se borra el token local y se da de baja el token de push.

## Notificaciones push

La app registra su token de **Firebase Cloud Messaging** en `POST /api/fcm-tokens`
para recibir avisos (cambio de estado, seguimiento nuevo, recordatorios, alta).
En **Expo Go** el token nativo puede no estar disponible (el registro falla en
silencio); para producción hay que configurar el proyecto de Firebase
(`google-services.json`) con EAS Build o `expo prebuild`.
Detalle completo: [`../docs/NOTIFICACIONES.md`](../docs/NOTIFICACIONES.md).

## Ejecutar

```bash
npm install
npm start          # abre Expo; escanear el QR con Expo Go
```

> **Backend**: la app apunta a `http://localhost:4000` (constante `API_URL` en
> `src/api.ts`). En un dispositivo físico reemplazala por la IP local de la
> máquina que corre el backend (ej. `http://192.168.0.10:4000`).

## Estructura

```
ssc-mobile/
├── App.tsx                  # Sesión + navegación por pestañas
├── index.ts                 # Registro del componente raíz (Expo)
└── src/
    ├── api.ts               # Cliente HTTP + JWT + SecureStore
    ├── push.ts              # Registro/baja del token FCM
    ├── theme.ts             # Paleta y estilos base
    ├── types.ts             # Tipos de dominio + catálogos
    └── screens/
        ├── LoginScreen.tsx
        ├── BoardScreen.tsx      # Tablero público (familiares)
        ├── SurgeriesScreen.tsx  # Mis cirugías + checklist
        ├── SymptomsScreen.tsx   # Registro de síntomas
        ├── PostopScreen.tsx     # Seguimiento postoperatorio
        └── ProfileScreen.tsx
```
