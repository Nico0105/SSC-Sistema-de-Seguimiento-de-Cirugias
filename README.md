# SSC — Sistema de Seguimiento de Cirugías Especializadas

Monorepo con tres proyectos independientes:

- **`backend/`** — API REST + WebSocket (Node.js + Express + TypeScript + Prisma + PostgreSQL + Socket.io)
- **`frontend/`** — Plataforma web administrativa + pantalla pública para familiares (React + Vite + Tailwind)
- **`ssc-mobile/`** — App móvil de seguimiento para familiares (React Native + Expo)

## Inicio rápido

### 1. Pre-requisitos
- Node.js 20+
- PostgreSQL 15+ instalado localmente
- VSCode (recomendado)

### 2. Levantar el backend
Ver instrucciones completas en [`backend/README.md`](backend/README.md).

```bash
cd backend
npm install
cp .env.example .env       # editar DATABASE_URL y JWT_SECRET
npx prisma migrate dev --name init
npm run seed               # crea admin demo: admin@ssc.local / Admin123!
npm run dev                # http://localhost:4000
```

### 3. Levantar el frontend (en otra terminal)
Ver instrucciones completas en [`frontend/README.md`](frontend/README.md).

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                # http://localhost:3000
```

### 4. Probar
1. Abrí `http://localhost:3000/auth` y entrá con `admin@ssc.local` / `Admin123!`
2. Cargá un paciente en `/patients`
3. Creá una cirugía en `/surgeries`
4. Abrí `/board` en otra ventana → avanzá el estado de la cirugía desde el detalle y verás la actualización en tiempo real.

### 5. App móvil (opcional)
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
- `User` + `UserRole` (admin · jefe_quirofano · medico · administrativo · enfermero · familiar)
- `Patient` (con soft delete: se conserva el historial clínico)
- `OperatingRoom`
- `Surgery` + `SurgeryStatusHistory` (timeline de cambios de estado)
- `Appointment` (turnos: consulta · prequirúrgica · control · estudio)

## Flujo de estados de una cirugía

El backend valida cada transición (no se pueden saltear ni revertir etapas):

```
programada → ingreso → preoperatorio → en_quirofano → recuperacion → postoperatorio → alta
     │           │            │
     └───────────┴────────────┴──► cancelada   (hasta entrar a quirófano)
```

Al entrar a quirófano se registra `startedAt`; al pasar a recuperación, `endedAt`.

## Roles y permisos

| Acción                        | admin | jefe_quirofano | administrativo | medico | enfermero |
|-------------------------------|:-----:|:--------------:|:--------------:|:------:|:---------:|
| Ver panel interno             |  ✔    |  ✔             |  ✔             |  ✔     |  ✔        |
| ABM pacientes/cirugías/turnos |  ✔    |  ✔             |  ✔             |        |           |
| Cambiar estado de cirugía     |  ✔    |  ✔             |                |        |  ✔        |
| Gestión de usuarios           |  ✔    |                |                |        |           |

La pantalla `/board` y la app móvil son públicas y sólo muestran el **código público anónimo** de cada cirugía (nunca datos del paciente).

## Documentación adicional
- [`docs/AUDITORIA.md`](docs/AUDITORIA.md) — informe de auditoría técnica: errores encontrados y corregidos, mejoras aplicadas y funcionalidades pendientes respecto de la documentación funcional.

## Próximos pasos sugeridos
- Checklist preoperatorio y registro de síntomas (definidos en la documentación funcional)
- Notificaciones push para familiares (FCM / PWA)
- Historial clínico consolidado por paciente y exportación PDF
- Métricas y reportes
