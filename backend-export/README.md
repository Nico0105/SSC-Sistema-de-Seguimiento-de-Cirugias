# SSC Backend — Express + Prisma + PostgreSQL

Backend del Sistema de Seguimiento de Cirugías Especializadas.
Reemplaza a Supabase con tu propia base PostgreSQL local.

## Stack
- Node.js 20+ / TypeScript
- Express 4
- Prisma ORM
- PostgreSQL 15+ (instalado localmente)
- JWT (jsonwebtoken) + bcrypt
- Socket.io (tiempo real para Dashboard y Pantalla Pública)
- Zod (validación)

## Requisitos previos
1. **Node.js 20+** → https://nodejs.org
2. **PostgreSQL 15+** instalado en tu PC → https://www.postgresql.org/download/
3. **VSCode** con extensiones recomendadas: Prisma, ESLint, REST Client

## Setup paso a paso

### 1. Crear la base de datos
Abrí `psql` (o pgAdmin) y ejecutá:
```sql
CREATE DATABASE ssc_db;
CREATE USER ssc_user WITH PASSWORD 'ssc_pass_segura';
GRANT ALL PRIVILEGES ON DATABASE ssc_db TO ssc_user;
ALTER DATABASE ssc_db OWNER TO ssc_user;
```

### 2. Instalar dependencias
```bash
cd backend-export
npm install
```

### 3. Configurar variables de entorno
Copiá `.env.example` a `.env` y editá:
```bash
cp .env.example .env
```
Ajustá `DATABASE_URL` con tu usuario/password/puerto:
```
DATABASE_URL="postgresql://ssc_user:ssc_pass_segura@localhost:5432/ssc_db"
JWT_SECRET="cambiar-por-string-aleatorio-largo"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

### 4. Crear el schema en Postgres
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. (Opcional) Seed con datos demo
```bash
npm run seed
```
Crea un admin: `admin@ssc.local` / `Admin123!`

### 6. Levantar el servidor
```bash
npm run dev
```
API en `http://localhost:4000` · Socket.io en el mismo puerto.

## Endpoints principales

### Auth
- `POST /api/auth/register` `{ email, password, fullName }`
- `POST /api/auth/login` `{ email, password }` → `{ token, user }`
- `GET /api/auth/me` (Bearer token)

### Pacientes (auth + rol staff)
- `GET /api/patients`
- `POST /api/patients`
- `PATCH /api/patients/:id`
- `DELETE /api/patients/:id` (soft delete)

### Cirugías
- `GET /api/surgeries`
- `GET /api/surgeries/:id`
- `POST /api/surgeries`
- `PATCH /api/surgeries/:id` (cambios de estado disparan evento realtime)
- `GET /api/surgeries/:id/history`

### Quirófanos
- `GET /api/operating-rooms`
- `POST /api/operating-rooms`

### Turnos
- `GET /api/appointments`
- `POST /api/appointments`

### Público (sin auth) — pantalla familiares
- `GET /api/public/board` → lista de cirugías del día con campos seguros (código, estado, hora). Sin datos del paciente.

## Tiempo real (Socket.io)
Conectarse desde el frontend:
```ts
import { io } from "socket.io-client";
const socket = io("http://localhost:4000");
socket.on("surgery:update", (payload) => { /* ... */ });
```
Eventos emitidos:
- `surgery:update` — al cambiar estado de cualquier cirugía
- `surgery:created`
- `surgery:deleted`

## Conectar tu frontend (Lovable export)
En el frontend, reemplazá los imports de `@/integrations/supabase/client` por el cliente que está en `frontend-adapter/api-client.ts` (incluido en este zip). Y en lugar de canales realtime de Supabase, usá `socket.io-client`. Ver `frontend-adapter/README.md`.

## Scripts
- `npm run dev` — desarrollo con tsx watch
- `npm run build` — compila a `dist/`
- `npm start` — corre `dist/`
- `npm run seed` — datos demo
- `npx prisma studio` — UI para inspeccionar la DB

## Arquitectura
```
backend-export/
├── prisma/
│   ├── schema.prisma         # Modelo de datos
│   └── seed.ts               # Datos iniciales
├── src/
│   ├── server.ts             # Bootstrap Express + Socket.io
│   ├── lib/
│   │   ├── prisma.ts         # Cliente Prisma singleton
│   │   ├── auth.ts           # JWT helpers
│   │   └── realtime.ts       # Emisor de eventos socket.io
│   ├── middleware/
│   │   ├── auth.ts           # requireAuth + requireRole
│   │   └── error.ts          # handler global
│   └── routes/
│       ├── auth.ts
│       ├── patients.ts
│       ├── surgeries.ts
│       ├── operating-rooms.ts
│       ├── appointments.ts
│       └── public.ts
└── README.md
```

## Roles soportados
`admin` · `jefe_quirofano` · `medico` · `administrativo` · `enfermero` · `familiar`

El primer usuario registrado obtiene rol `admin` automáticamente.
