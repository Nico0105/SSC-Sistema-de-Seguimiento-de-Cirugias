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
| `/emails`                | Roles ABM       | Auditoría de emails enviados (Brevo)                |
| `/users`                 | Admin           | Gestión de usuarios y vínculo cuenta ↔ paciente      |
| `/my-care`               | Rol paciente    | Portal del paciente: cirugías, checklist, síntomas   |
| `/board`                 | Público         | Pantalla fullscreen para familiares                  |

## Flujo de uso
1. Iniciar el backend (`cd ../backend && npm run dev`) y correr `npm run seed` (crea un usuario por rol, ver [`../CREDENCIALES.md`](../CREDENCIALES.md), y dos quirófanos).
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
    │   ├── permissions.ts       # Matriz de permisos por rol (espejo del backend)
    │   ├── nav-config.ts        # Ítems de la navegación por pestañas
    │   ├── surgery-status.ts    # Estados, tonos de color, flujo y transiciones
    │   ├── room-status.ts       # Estado de quirófanos, retrasos y métricas del día
    │   ├── calendar.ts          # Semana, eventos de agenda (turnos + cirugías)
    │   ├── format.ts            # Horas, fechas, edades, iniciales, duraciones
    │   └── types.ts             # Tipos de dominio compartidos
    ├── hooks/
    │   ├── use-realtime.ts        # Suscripción a eventos Socket.io
    │   ├── use-socket-status.ts   # Estado real de la conexión (indicador "sincronizado")
    │   ├── use-surgeries-query.ts # Cirugías con TanStack Query + invalidación en vivo
    │   ├── use-catalog-queries.ts # Quirófanos, pacientes y turnos (caché compartida)
    │   └── use-clock.ts           # Reloj en vivo y cronómetros
    ├── components/
    │   ├── AppShell.tsx           # Layout: encabezado + pestañas + barra de estado
    │   ├── layout/                # TopNav, StatusBar, UserMenu, BrandMark
    │   ├── ui/                    # Primitivas: Button, Card, KpiCard, PageHeader,
    │   │                          #   DataTable, Sheet, StatusBadge, CodeChip, Tabs…
    │   ├── RoomCard.tsx           # Tarjeta de quirófano del centro de comando
    │   ├── SurgeryColumns.tsx     # Columnas compartidas de tablas de cirugías
    │   ├── SurgeryStepper.tsx     # Línea temporal por fases
    │   ├── ScheduleSurgerySheet.tsx # Panel "Programar intervención quirúrgica"
    │   ├── ChecklistPanel.tsx · PostopPanel.tsx · MessagesPanel.tsx
    │   └── ProtectedRoute.tsx · RoleRoute.tsx
    └── pages/                     # Una pantalla por ruta (carga diferida)
        ├── Auth.tsx               # Login
        ├── Dashboard.tsx          # Centro de Comando Quirúrgico
        ├── Surgeries.tsx · SurgeryDetail.tsx
        ├── Patients.tsx · PatientHistory.tsx
        ├── Appointments.tsx       # Agenda y calendario semanal
        ├── EmailLogs.tsx          # Centro de notificaciones
        ├── Users.tsx              # Usuarios, roles y permisos
        ├── MyCare.tsx             # Portal del paciente
        └── Board.tsx              # Pantalla pública de sala de espera
```

## Sistema visual

Diseño minimalista orientado a reducir la carga cognitiva del personal:

- **Una sola acción principal por pantalla** (botón azul `navy-600`); las
  acciones secundarias son botones *ghost* o links de texto.
- **Paleta neutra**: fondo `#F8F9FA`, superficies blancas con borde hiperfino
  (`slate-100`) y un único color de acento. Los estados usan pasteles
  desaturados (`STATUS_TONE` en `lib/surgery-status.ts`).
- **Tres niveles tipográficos**: título, cifra/dato principal y texto
  secundario en gris. Monoespaciada sólo para códigos y horarios.
- **Divulgación progresiva**: lo secundario va en pestañas (detalle de
  cirugía, historia clínica), desplegables o el menú de usuario.
- Todos los datos en pantalla salen de la API: no hay valores de ejemplo.

## Build de producción
```bash
npm run build
npm run preview
```
Los archivos quedan en `dist/` listos para servir con cualquier hosting estático (Nginx, Vercel, Netlify, etc.).
