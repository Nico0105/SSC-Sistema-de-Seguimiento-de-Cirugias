# Informe de Auditoría Técnica — SSC

**Fecha:** Julio 2026
**Alcance:** backend, frontend web, app móvil, base de datos y documentación del repositorio.
**Fuente de verdad funcional:** Documento de Alcance y Documento Funcional del SSC.

---

## 1. Errores encontrados y corregidos

### Seguridad (backend)

| # | Problema | Corrección |
|---|----------|------------|
| 1 | `JWT_SECRET` con fallback inseguro (`dev-secret-change-me`) incluso en producción | Nueva capa `src/config/env.ts`: en producción la app **no arranca** sin un secreto válido; en desarrollo advierte por consola |
| 2 | El manejador de errores devolvía `err.message` interno en los 500 (posible fuga de detalles de Prisma/SQL) | El 500 responde un mensaje genérico; el detalle queda sólo en el log del servidor |
| 3 | Sin headers de seguridad HTTP | Se agregó `helmet` |
| 4 | Login sin protección contra fuerza bruta | `express-rate-limit`: máx. 10 intentos por IP cada 15 minutos |
| 5 | CORS con fallback `"*"` (HTTP y Socket.io) | Origen por defecto `http://localhost:3000`; nunca `*` |
| 6 | Errores de Prisma sin mapear: duplicados (P2002) y registros inexistentes (P2025) devolvían 500 | Mapeados a 409/404 con mensajes claros en `middleware/error.ts` |
| 7 | Un admin podía desactivarse o quitarse su rol admin (sistema sin administradores) | Reglas de negocio en `routes/users.ts` (400 con mensaje explicativo) |
| 8 | `express.json()` sin límite de tamaño | Límite de 1 MB |
| 9 | **Fuga de datos personales por Socket.io**: los eventos `surgery:*` difundían nombre y documento del paciente a todos los clientes, incluida la pantalla pública sin autenticación | Los eventos ahora emiten sólo `{id, publicCode, status}`; los clientes internos recargan por REST autenticado |
| 10 | `/auth/me` seguía siendo válido para usuarios desactivados después de emitir el token | Ahora responde 401 si el usuario fue desactivado o eliminado |

### Bugs lógicos (backend)

| # | Problema | Corrección |
|---|----------|------------|
| 11 | `Surgery.startedAt` / `endedAt` existían en el schema pero **nunca se escribían** | Se marcan automáticamente al entrar a quirófano y al pasar a recuperación |
| 12 | Sin máquina de estados: se podía pasar de `alta` a `programada`, revivir canceladas, saltear etapas | Nueva `lib/surgery-status.ts` con las transiciones del flujo documentado; el backend responde 409 ante transiciones inválidas |
| 13 | Cambio de estado + registro de historial en dos operaciones sueltas (riesgo de estado sin historial) | Ambas operaciones dentro de una transacción de Prisma |
| 14 | `GET /api/patients/:id` devolvía pacientes eliminados lógicamente | Filtra `deletedAt: null` y responde 404 |
| 15 | `Appointment.type/status` y `Surgery.priority` aceptaban cualquier string | Validados con enums de Zod según los valores documentados |
| 16 | El estado inicial de una cirugía podía forzarse en el alta | Toda cirugía nace `programada` (el estado sólo cambia por `PATCH /:id/status`) |

### Frontend web

| # | Problema | Corrección |
|---|----------|------------|
| 17 | **El build de producción estaba roto**: faltaba `src/vite-env.d.ts` y `tsc -b` fallaba con `Property 'env' does not exist on type 'ImportMeta'` | Se creó `vite-env.d.ts` con los tipos de las variables `VITE_*`; `npm run build` ahora compila |
| 18 | Reloj de la pantalla pública congelado (se evaluaba una sola vez al render) | Hook `useClock` que actualiza cada segundo |
| 19 | Si `auth.me()` fallaba (backend caído), `loading` quedaba `true` para siempre → "Cargando…" eterno | `catch` + `finally` en el `AuthProvider` |
| 20 | Sin manejo de expiración del token: la app quedaba en estado zombie ante un 401 | El cliente HTTP limpia el token y emite `ssc:unauthorized`; el `AuthProvider` cierra la sesión y redirige al login |
| 21 | Cargas de datos sin `try/catch` ni estado de error en Patients, Surgeries, Appointments, Users; acciones (`changeStatus`, `toggleActive`, `remove`) sin manejo de error | Todas las páginas tienen loading, error visible (`ErrorAlert`) y estado "Guardando…" que evita doble submit |
| 22 | `catch (e: any)` en todas las páginas | Helper tipado `getErrorMessage(error: unknown)` y clase `ApiError` |
| 23 | Labels del formulario de pacientes en inglés crudo (`firstName`, `lastName`…) | Etiquetas en español |
| 24 | El detalle de cirugía ofrecía los 8 estados como botones (incluidas transiciones inválidas) | Sólo muestra los pasos válidos desde el estado actual (espejo de la máquina de estados del backend) |
| 25 | Contexto de auth recreaba su `value` en cada render | `useMemo` + `useCallback` |
| 26 | Grillas fijas (`grid-cols-3/4`) y tablas que rompían el layout en pantallas chicas | Grillas responsive (`grid-cols-1 md:grid-cols-*`), tablas con scroll horizontal (`TableCard`), sidebar apilable en mobile |
| 27 | `<style>` inline en la página de login | Reemplazado por los componentes UI compartidos con Tailwind |

### Mobile

| # | Problema | Corrección |
|---|----------|------------|
| 28 | La app era la plantilla vacía de Expo ("Open up App.tsx…") | Primera versión funcional: pantalla de seguimiento para familiares que consume `/api/public/board`, con filtro por código público, refresco automático (30 s) y pull-to-refresh |
| 29 | `@types/react ~19` con React 18.3 (tipos de otra versión mayor) | Alineado a `@types/react ~18.3` (verificado con `tsc --noEmit`) |

### Documentación del repositorio

| # | Problema | Corrección |
|---|----------|------------|
| 30 | README del backend indicaba login `admin@ssc.com`, pero el seed crea `admin@ssc.local` | Unificado en `admin@ssc.local` |
| 31 | README del frontend describía "registro público" y "el primer usuario es admin automáticamente" — funcionalidad inexistente | Documentado el flujo real: las cuentas las crea un administrador |
| 32 | README raíz no mencionaba la app móvil ni el flujo de estados | Actualizado: arquitectura con mobile, diagrama del flujo de estados y matriz de roles/permisos |

## 2. Refactor y mejoras de calidad

- **Backend**: nueva capa `config/` (variables de entorno validadas en un solo lugar), máquina de estados en `lib/surgery-status.ts`, `HttpError` para errores de negocio con código HTTP, serializadores que garantizan no exponer `passwordHash`.
- **Frontend**: se eliminó todo el código duplicado —
  - `components/ui.tsx`: `Input`, `Select`, `StatusBadge`, `PrimaryButton`, `ErrorAlert`, `Loading`, `EmptyRow`, `TableCard` (antes copiados en 3–4 páginas);
  - `hooks/use-realtime.ts`: suscripción a Socket.io (antes copiada en 4 páginas);
  - `lib/types.ts`: tipos de dominio compartidos (antes cada página redeclaraba interfaces parciales).
- **Optimización**: `useMemo` para métricas del dashboard, `useCallback` en cargas, carga de catálogos en paralelo con `Promise.all` (ya existente, conservado), suscripción de sockets con `useRef` para no reconectar en cada render, singleton de socket.
- **Documentación del código**: cabecera explicativa en cada archivo + comentarios en cada endpoint, middleware, hook, contexto, componente y algoritmo (backend, frontend y mobile).

## 3. Problemas preexistentes fuera del alcance de esta auditoría

- **No hay tests automatizados** en ningún proyecto (se recomienda Vitest + Supertest en backend como primer paso).
- El enum de roles de la base incluye `enfermero` y `familiar` y no incluye `paciente` (mencionado en la documentación). Cambiarlo requiere una migración de PostgreSQL que debe ejecutarse contra la base real (`prisma migrate dev`).
- La documentación menciona **Pusher** como servicio de tiempo real; el proyecto usa **Socket.io autoalojado**, que cumple el mismo requisito sin depender de credenciales de terceros. La decisión quedó documentada en `backend/src/lib/realtime.ts`.
- Las versiones del `package.json` de `ssc-mobile` (Expo 54 + React Native 0.76) no son el par oficial del SDK; instala y tipa correctamente, pero conviene alinear con `npx expo install --fix` cuando se trabaje activamente en la app.

## 4. Funcionalidades que faltan según la documentación funcional

Pendientes de implementar (no se inventaron a medias para no contradecir la documentación):

1. **Checklist preoperatorio** (ítems verificables antes de quirófano).
2. **Registro de síntomas** del paciente en el postoperatorio.
3. **Seguimiento postoperatorio detallado** más allá del estado de la cirugía.
4. **Historial clínico consolidado** por paciente (hoy existe el timeline por cirugía).
5. **Notificaciones push** a familiares (Firebase Cloud Messaging).
6. **Rol paciente** con acceso a su propia información.
7. **App móvil completa** (hoy cubre el seguimiento público para familiares; falta login del staff y gestión).

## 5. Posibles mejoras futuras

- Tests unitarios y de integración; CI con lint + typecheck + build.
- Paginación en listados (hoy se devuelven todas las filas).
- Refresh tokens y expiración corta del JWT.
- Auditoría de accesos (quién vio qué historia clínica).
- Exportación PDF del historial quirúrgico y métricas/reportes.
