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

| Ruta              | Acceso          | Descripción                                  |
| ----------------- | --------------- | -------------------------------------------- |
| `/auth`           | Público         | Login + registro                             |
| `/dashboard`      | Autenticado     | Resumen operativo + tabla en tiempo real     |
| `/surgeries`      | Autenticado     | Listado y alta de cirugías                   |
| `/surgeries/:id`  | Autenticado     | Detalle, cambio de estado, timeline          |
| `/patients`       | Autenticado     | CRUD de pacientes                            |
| `/appointments`   | Autenticado     | Turnos                                       |
| `/board`          | Público         | Pantalla fullscreen para familiares          |

## Flujo de uso
1. Iniciar el backend (`cd ../backend && npm run dev`).
2. Iniciar el frontend (`npm run dev`).
3. Ir a `/auth` y registrarse — el **primer usuario** es admin automáticamente.
4. Cargar pacientes y quirófanos (los quirófanos se siembran con `npm run seed` del backend).
5. Crear una cirugía desde `/surgeries`.
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
    │   ├── api-client.ts        # HTTP + JWT + socket.io
    │   ├── auth-context.tsx
    │   └── surgery-status.ts
    ├── components/
    │   ├── AppShell.tsx         # Layout autenticado con sidebar
    │   └── ProtectedRoute.tsx
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
