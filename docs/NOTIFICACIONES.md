# Notificaciones del SSC — Flujo completo

El sistema usa **tres canales**, cada uno con una responsabilidad clara:

| Canal | Tecnología | Para qué se usa |
|-------|-----------|-----------------|
| Tiempo real | **Socket.IO** (autoalojado, mismo puerto que la API) | Refrescar en vivo el panel interno y la pantalla pública de familiares |
| Push | **Firebase Cloud Messaging (FCM)** | Avisos al paciente en su celular / navegador |
| Email | **Resend API** | Correos transaccionales (confirmaciones, recordatorios, alta) |

> El sistema **no usa Pusher**. Socket.IO cubre el tiempo real.

---

## 1. Tiempo real (Socket.IO)

- El backend emite `surgery:created`, `surgery:update` y `surgery:deleted` con un
  payload **mínimo y anónimo** (`{ id, publicCode, status }`), porque la pantalla
  pública también recibe los eventos.
- Los clientes usan el evento sólo como disparador y recargan por REST autenticado.
- Código: `backend/src/lib/realtime.ts`, `frontend/src/hooks/use-realtime.ts`.

## 2. Push (Firebase Cloud Messaging)

### Flujo del token
1. El cliente (web o mobile) pide permiso de notificaciones y obtiene su token FCM.
2. Lo registra en el backend: `POST /api/fcm-tokens { token, platform }`.
3. El backend guarda el token en la tabla `FcmToken` (un usuario puede tener varios
   dispositivos). Al cerrar sesión, el cliente lo da de baja (`DELETE /api/fcm-tokens`).
4. Cuando ocurre un evento de negocio, el backend envía la push a **todos** los
   dispositivos del usuario (`lib/fcm.ts → sendPushToUser`). Los tokens que FCM
   reporta como inválidos se eliminan automáticamente.

### Eventos que disparan push al paciente
| Evento | Dónde se dispara |
|--------|------------------|
| Cambio de estado de su cirugía | `PATCH /api/surgeries/:id/status` |
| Nuevo seguimiento cargado | `POST /api/surgeries/:id/postop` |
| Alta médica | cambio de estado a `alta` |
| Recordatorio de cirugía (48 h / 24 h) | scheduler (`lib/scheduler.ts`) |

### Configuración
- **Backend**: `FIREBASE_SERVICE_ACCOUNT_BASE64` (JSON del service account en base64)
  o `FIREBASE_SERVICE_ACCOUNT_PATH`. Sin credencial ⇒ el push queda deshabilitado
  (no-op) y el resto del sistema funciona igual.
- **Web**: variables `VITE_FIREBASE_*` + `VITE_FIREBASE_VAPID_KEY` en `frontend/.env`
  y la misma configuración pública en `frontend/public/firebase-messaging-sw.js`.
- **Mobile**: en Expo Go el token nativo puede no estar disponible; para un build de
  producción hay que agregar `google-services.json` (Android) via `expo prebuild`
  o EAS Build. El registro falla de forma silenciosa si no está configurado.

## 3. Emails (Resend)

### Flujo
1. Las rutas de negocio llaman a los helpers de `backend/src/lib/email.ts`
   (`sendSurgeryConfirmation`, `sendSurgeryReminder`, etc.).
2. El servicio envía por la API HTTP de Resend (`RESEND_API_KEY`, `EMAIL_FROM`).
3. **Cada intento queda auditado** en la tabla `EmailLog` con estado
   `enviado` / `fallido` / `omitido` (omitido = sin API key o el paciente no tiene
   email). El envío nunca rompe la operación de negocio que lo disparó.
4. La pantalla web **Emails** (`/emails`, roles ABM) muestra la auditoría completa.

### Emails automáticos
| Email | Disparador |
|-------|-----------|
| Confirmación de cirugía | alta de cirugía |
| Indicaciones preoperatorias | alta de cirugía |
| Cambio de fecha/horario | edición de `scheduledAt` |
| Recordatorio 48 h antes | scheduler (idempotente vía `EmailLog`) |
| Recordatorio 24 h antes | scheduler (idempotente vía `EmailLog`) |
| Alta médica | cambio de estado a `alta` |
| Confirmación de turno/control | alta de turno |

## 4. Scheduler de recordatorios

`backend/src/lib/scheduler.ts` corre en el mismo proceso del servidor:
- Cada 15 minutos busca cirugías activas con `scheduledAt` dentro de las próximas
  48 h / 24 h.
- Usa `EmailLog` como registro de idempotencia: cada recordatorio se envía **una
  sola vez por cirugía**, aunque el proceso se reinicie.
- Envía email (Resend) + push (FCM) en el mismo ciclo.
