# Actualización del Documento de Alcance — SSC

Este documento registra los cambios que deben reflejarse en el **Documento de
Alcance** y en el **Documento Funcional** del SSC (los PDF originales), tras la
segunda etapa de desarrollo. Sirve como anexo formal hasta regenerar los PDF.

---

## 1. Sección "Tecnologías y APIs" (reemplaza a la anterior)

**Se elimina:** Pusher (no se utiliza en el sistema).

**Queda así:**

- **Frontend Web**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL + Prisma ORM
- **Mobile**: React Native + Expo
- **Autenticación**: JWT (con renovación de token y sesión persistida en mobile)
- **Socket.IO** — comunicación en tiempo real (panel interno y pantalla pública)
- **Firebase Cloud Messaging** — API de notificaciones push (web y mobile)
- **Resend API** — API de envío de correos electrónicos transaccionales

## 2. Funcionalidades incorporadas

1. **Checklist preoperatorio configurable**: plantilla administrable (admin/jefa de
   quirófano), instanciada por cirugía; se marca/desmarca con trazabilidad de quién
   y cuándo. El paciente sólo lo visualiza.
2. **Registro de síntomas**: el paciente (web y mobile) registra síntomas diarios
   (dolor, ardor, visión borrosa, fiebre, inflamación, sangrado, otros), nivel de
   dolor 0–10, observaciones y fecha/hora. Persistido en PostgreSQL vía Prisma.
3. **Seguimiento postoperatorio**: controles diarios del personal clínico (estado
   del paciente, evolución, medicación, cumplimiento, observaciones) con historial
   cronológico por cirugía.
4. **Historial clínico consolidado**: vista única por paciente con datos personales,
   cirugías (timeline + checklist + controles), síntomas, medicación vigente,
   alertas automáticas (dolor intenso, fiebre, sangrado, complicaciones) y emails
   enviados. Orden cronológico.
5. **Rol Paciente**: nuevo rol con cuenta vinculada a su ficha (`Patient.userId`).
   Permisos: ver sus datos, sus cirugías, su checklist, registrar síntomas, ver
   indicaciones/recordatorios/evolución. No administra pacientes ni edita cirugías.
6. **Login mobile**: autenticación JWT en React Native con sesión persistida en
   almacenamiento seguro (expo-secure-store), renovación de token al abrir la app
   y cierre de sesión.
7. **Notificaciones push (FCM)** y **emails automáticos (Resend)**: ver
   `docs/NOTIFICACIONES.md` (flujo completo, eventos y configuración).

## 3. Casos de uso agregados

| CU | Actor | Descripción |
|----|-------|-------------|
| Configurar checklist | Admin / Jefa de quirófano | ABM de ítems de la plantilla |
| Completar checklist | Staff | Marcar/desmarcar ítems de una cirugía |
| Ver checklist propio | Paciente | Visualización de su checklist (sólo lectura) |
| Registrar síntomas | Paciente / Staff | Carga diaria de síntomas y nivel de dolor |
| Cargar control postoperatorio | Personal clínico | Registro de estado, evolución y medicación |
| Consultar historial clínico | Staff | Vista consolidada con alertas |
| Consultar mi evolución | Paciente | Portal propio (web y app) |
| Recibir notificaciones | Paciente | Push + email por eventos y recordatorios |
| Auditar emails | Roles ABM | Pantalla "Emails" con el estado de cada envío |

## 4. Modelo de datos agregado

`ChecklistTemplate`, `SurgeryChecklistItem`, `SymptomReport`, `PostopRecord`,
`FcmToken`, `EmailLog`; enum `AppRole` extendido con `paciente`; vínculo
`Patient.userId → User`. Migración: `20260729120000_patient_care_and_notifications`
(aditiva, sin pérdida de datos).

## 5. Variables de entorno agregadas

Ver `backend/.env.example` y `frontend/.env.example`:
`RESEND_API_KEY`, `EMAIL_FROM`, `FIREBASE_SERVICE_ACCOUNT_BASE64` /
`FIREBASE_SERVICE_ACCOUNT_PATH`, `VITE_FIREBASE_*`, `VITE_FIREBASE_VAPID_KEY`.
