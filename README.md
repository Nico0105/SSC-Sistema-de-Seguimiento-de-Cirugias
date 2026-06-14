# SSC — Sistema de Seguimiento de Cirugías Especializadas

Monorepo con dos proyectos independientes:

- **`backend/`** — API REST + WebSocket (Node.js + Express + Prisma + PostgreSQL + Socket.io)
- **`frontend/`** — Plataforma web administrativa + pantalla pública (React + Vite + Tailwind)

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
4. Abrí `/board` en otra ventana → cambiá el estado de la cirugía y verás la actualización en tiempo real.

## Arquitectura

```
┌──────────────────┐    HTTP/REST + JWT     ┌──────────────────┐
│                  │ ─────────────────────► │                  │
│   Frontend       │                        │   Backend        │
│   (React+Vite)   │ ◄────────────────────  │   (Express)      │
│   localhost:3000 │     WebSocket (RT)     │   localhost:4000 │
└──────────────────┘                        └────────┬─────────┘
                                                     │ Prisma
                                                     ▼
                                            ┌──────────────────┐
                                            │   PostgreSQL     │
                                            │   localhost:5432 │
                                            └──────────────────┘
```

## Modelos de datos
- `User` + `UserRole` (admin · jefe_quirofano · medico · administrativo · enfermero · familiar)
- `Patient` (con soft delete)
- `OperatingRoom`
- `Surgery` (estados: programada → ingreso → preoperatorio → en_quirofano → recuperacion → postoperatorio → alta)
- `SurgeryStatusHistory` (timeline de cambios)
- `Appointment`

## Próximos pasos sugeridos
- Roles más finos en el frontend (mostrar/ocultar acciones por rol)
- Notificaciones push para familiares (PWA)
- App mobile con React Native compartiendo el mismo backend
- Exportación PDF de historia quirúrgica
- Métricas y reportes
