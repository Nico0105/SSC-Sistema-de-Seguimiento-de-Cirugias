# SSC Frontend — React + Vite + Tailwind

Plataforma web administrativa del Sistema de Seguimiento de Cirugías.
Consume el backend en `../backend`.

## Stack
- React 18 + TypeScript
- Vite 5
- React Router DOM 6
- Tailwind CSS 3
- Socket.io-client (tiempo real)

## Requisitos
- Node.js 20+
- El backend corriendo en `http://localhost:4000` (ver `../backend/README.md`)

## Instalación
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Abre `http://localhost:3000`.

## Variables de entorno
```
VITE_API_URL=http://localhost:4000
```

## Rutas

| Ruta                     | Acceso          | Descripción                                          |
| ------------------------ | --------------- | ---------------------------------------------------- |
| `/auth`                  | Público         | Login (las cuentas las crea un administrador)        |
| `/dashboard`             | Staff           | Resumen operativo + tabla en tiempo real             |
| `/surgeries`             | Staff           | Listado y alta de cirugías                           |
| `/surgeries/:id`         | Staff           | Detalle, estado, checklist, seguimiento, timeline    |
| `/patients`              | Staff           | CRUD de pacientes                                    |
| `/patients/:id/history`  | Staff           | Historial clínico consolidado con alertas            |
| `/appointments`          | Staff           | Turnos                                               |
| `/emails`                | Roles ABM       | Auditoría de emails enviados (Resend)                |
| `/users`                 | Admin           | Gestión de usuarios y vínculo cuenta ↔ paciente      |
| `/my-care`               | Rol paciente    | Portal del paciente: cirugías, checklist, síntomas   |
| `/board`                 | Público         | Pantalla fullscreen para familiares                  |

## Flujo de uso
1. Iniciar el backend (`cd ../backend && npm run dev`) y correr `npm run seed` (crea el admin `admin@ssc.local` / `Admin123!` y dos quirófanos).
2. Iniciar el frontend (`npm run dev`).
3. Ir a `/auth` e iniciar sesión con el admin del seed (no existe registro público: las cuentas las crea el administrador en `/users`).
4. Cargar pacientes en `/patients`.
5. Crear una cirugía desde `/surgeries` y avanzar su estado desde el detalle (el sistema sólo permite las transiciones válidas del flujo quirúrgico).
6. Abrir `/board` en otra ventana → al cambiar el estado desde el detalle, se actualiza en tiempo real.

## Estructura
```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── .env.example
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── lib/
    │   ├── api-client.ts        # HTTP + JWT + socket.io + manejo global de 401
    │   ├── auth-context.tsx     # Sesión en memoria + restauración desde localStorage
    │   ├── permissions.ts       # Roles y grupos de permisos de la UI
    │   ├── surgery-status.ts    # Estados, etiquetas, colores y transiciones
    │   └── types.ts             # Tipos de dominio compartidos
    ├── hooks/
    │   └── use-realtime.ts      # Suscripción a eventos Socket.io
    ├── components/
    │   ├── AppShell.tsx         # Layout autenticado con sidebar
    │   ├── ProtectedRoute.tsx
    │   └── ui.tsx               # Componentes UI reutilizables
    └── pages/
        ├── Auth.tsx
        ├── Dashboard.tsx
        ├── Patients.tsx
        ├── Surgeries.tsx
        ├── SurgeryDetail.tsx
        ├── Appointments.tsx
        └── Board.tsx
```

## Build de producción
```bash
npm run build
npm run preview
```
Los archivos quedan en `dist/` listos para servir con cualquier hosting estático (Nginx, Vercel, Netlify, etc.).
