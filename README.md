# SSC — Sistema de Seguimiento de Cirugías Especializadas

Monorepo con tres proyectos independientes:

- **`backend/`** — API REST + WebSocket (Node.js + Express + TypeScript + Prisma + PostgreSQL)
- **`frontend/`** — Plataforma web (panel del staff + portal del paciente + pantalla pública) — React + Vite + Tailwind
- **`ssc-mobile/`** — App móvil del paciente y familiares (React Native + Expo)

## Tecnologías y APIs

| Capa | Tecnología |
|------|-----------|
| Frontend web | React 18 + TypeScript + Vite + Tailwind |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL + Prisma ORM |
| Mobile | React Native + Expo |
| Autenticación | JWT (renovación de token + sesión segura en mobile) |
| Tiempo real | **Socket.IO** (panel interno y pantalla pública) |
| Notificaciones push | **Firebase Cloud Messaging** (web y mobile) |
| Emails transaccionales | **Resend API** (con auditoría en base de datos) |

> Flujo completo de notificaciones: [`docs/NOTIFICACIONES.md`](docs/NOTIFICACIONES.md)

## Inicio rápido

### 1. Pre-requisitos
- Node.js 20+
- PostgreSQL 15+ (instalado localmente, **o** Docker Desktop — ver opción B abajo)
- VSCode (recomendado)

### 2. Base de datos
Elegí una opción:

**Opción A — Docker (la más rápida, no requiere instalar PostgreSQL):**
```bash
docker run -d --name ssc-postgres \
  -e POSTGRES_USER=ssc_user \
  -e POSTGRES_PASSWORD=ssc_pass_segura \
  -e POSTGRES_DB=ssc_db \
  -p 5432:5432 \
  postgres:16-alpine
```
Con esto el `DATABASE_URL` por defecto de `backend/.env.example` ya funciona sin editar nada.
El contenedor persiste los datos mientras no se borre (`docker rm ssc-postgres`); para
volver a arrancarlo en otra sesión alcanza con `docker start ssc-postgres`.

**Opción B — PostgreSQL instalado localmente:** ver el paso 2 de
[`backend/README.md`](backend/README.md) (creación manual de usuario y base con `psql`).

### 3. Levantar el backend
Ver instrucciones completas en [`backend/README.md`](backend/README.md).

```bash
cd backend
npm install
cp .env.example .env       # con la Opción A no hace falta editar nada
npx prisma migrate deploy  # aplica las migraciones ya versionadas del repo
npm run seed               # crea admin demo: admin@ssc.local / Admin123!
npm run dev                # http://localhost:4000
```

### 4. Levantar el frontend (en otra terminal)
Ver instrucciones completas en [`frontend/README.md`](frontend/README.md).

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                # http://localhost:3000
```

### 5. Probar
1. Abrí `http://localhost:3000/auth` y entrá con `admin@ssc.local` / `Admin123!`
2. Cargá un paciente en `/patients`
3. Creá una cirugía en `/surgeries`
4. Abrí `/board` en otra ventana → avanzá el estado de la cirugía desde el detalle y verás la actualización en tiempo real.

### 6. App móvil (opcional)
```bash
cd ssc-mobile
npm install
npm start                  # Expo; escanear el QR con Expo Go
```
> En un dispositivo físico, editá `API_URL` en `ssc-mobile/App.tsx` con la IP local de la máquina que corre el backend.

## Arquitectura

```
┌──────────────────┐    HTTP/REST + JWT     ┌──────────────────┐
│   Frontend web   │ ─────────────────────► │                  │
│   (React+Vite)   │ ◄────────────────────  │   Backend        │
│   localhost:3000 │     WebSocket (RT)     │   (Express)      │
└──────────────────┘                        │   localhost:4000 │
┌──────────────────┐    HTTP (API pública)  │                  │
│   App móvil      │ ─────────────────────► │                  │
│   (Expo)         │                        └────────┬─────────┘
└──────────────────┘                                 │ Prisma
                                                     ▼
                                            ┌──────────────────┐
                                            │   PostgreSQL     │
                                            │   localhost:5432 │
                                            └──────────────────┘
```

## Modelos de datos
- `User` + `UserRole` (admin · jefe_quirofano · medico · administrativo · enfermero · familiar · **paciente**)
- `Patient` (con soft delete y vínculo opcional a una cuenta de acceso propia)
- `OperatingRoom`
- `Surgery` + `SurgeryStatusHistory` (timeline de cambios de estado)
- `Appointment` (turnos: consulta · prequirúrgica · control · estudio)
- `ChecklistTemplate` + `SurgeryChecklistItem` (checklist preoperatorio configurable)
- `SymptomReport` (registro diario de síntomas del paciente)
- `PostopRecord` (controles del seguimiento postoperatorio)
- `FcmToken` (dispositivos registrados para push) + `EmailLog` (auditoría de emails)

## Flujo de estados de una cirugía

El backend valida cada transición (no se pueden saltear ni revertir etapas):

```
programada → en_quirofano → esperando_en_sala (N) → postoperatorio → alta
     │
     └──► cancelada   (sólo mientras está programada)
```

Al entrar a quirófano se registra `startedAt`. Al salir, el paso a
"Esperando en sala" **exige el número de sala** (`waitingRoom`), se registra
`endedAt` y la pantalla de familiares muestra "Esperando en sala N".

## Roles y permisos

| Acción                            | admin | jefe_quirofano | administrativo | medico | enfermero | paciente |
|-----------------------------------|:-----:|:--------------:|:--------------:|:------:|:---------:|:--------:|
| Ver panel interno                 |  ✔    |  ✔             |  ✔             |  ✔     |  ✔        |          |
| ABM pacientes/cirugías/turnos     |  ✔    |  ✔             |  ✔             |        |           |          |
| Cambiar estado de cirugía         |  ✔    |  ✔             |                |        |  ✔        |          |
| Configurar plantilla de checklist |  ✔    |  ✔             |                |        |           |          |
| Marcar checklist de una cirugía   |  ✔    |  ✔             |  ✔             |  ✔     |  ✔        |          |
| Cargar control postoperatorio     |  ✔    |  ✔             |                |  ✔     |  ✔        |          |
| Ver historial clínico             |  ✔    |  ✔             |  ✔             |  ✔     |  ✔        | sólo el propio |
| Registrar síntomas                |  ✔*   |  ✔*            |  ✔*            |  ✔*    |  ✔*       | ✔ (propios) |
| Auditoría de emails               |  ✔    |  ✔             |  ✔             |        |           |          |
| Gestión de usuarios               |  ✔    |                |                |        |           |          |

\* el staff puede cargar síntomas en nombre del paciente.

El **rol paciente** sólo accede a su portal (`/my-care` en web, la app móvil):
ve sus datos, sus cirugías, su checklist (lectura), sus indicaciones y evolución,
y registra síntomas. No administra pacientes ni edita cirugías.

La pantalla `/board` y el tablero de la app móvil son públicos y sólo muestran el
**código público anónimo** de cada cirugía (nunca datos del paciente).

## Funcionalidades principales

- Gestión de pacientes, cirugías (con máquina de estados), quirófanos y turnos
- **Checklist preoperatorio configurable** por cirugía, con trazabilidad
- **Registro de síntomas** diario del paciente (web y mobile)
- **Seguimiento postoperatorio** con controles clínicos e historial cronológico
- **Historial clínico consolidado** con alertas automáticas
- **Portal del paciente** (web `/my-care` y app móvil con login JWT persistido)
- Dashboard, pantalla pública para familiares y actualización en tiempo real (Socket.IO)
- **Notificaciones push** (FCM) y **emails automáticos** (Resend) con recordatorios 48/24 h

## Documentación adicional
- [`docs/NOTIFICACIONES.md`](docs/NOTIFICACIONES.md) — flujo completo de Socket.IO + FCM + Resend y su configuración.
- [`docs/ACTUALIZACION_ALCANCE.md`](docs/ACTUALIZACION_ALCANCE.md) — anexo con los cambios a reflejar en el documento de alcance (tecnologías, casos de uso, modelo de datos).
- [`docs/AUDITORIA.md`](docs/AUDITORIA.md) — informe de auditoría técnica de la primera etapa.

## Próximos pasos sugeridos
- Exportación PDF del historial clínico
- Métricas y reportes
- Tests automatizados + CI
