# Frontend Adapter — Conectar el frontend de Lovable al backend Express

Este adapter reemplaza el cliente Supabase del frontend exportado por un
cliente HTTP que apunta a tu backend local (`http://localhost:4000`).

## Pasos

### 1. Exportar el frontend desde Lovable
Botón GitHub arriba a la derecha → *Create Repository* → clonalo en tu PC.

### 2. Instalar dependencias del frontend
```bash
cd <repo-frontend>
npm install
npm install socket.io-client
```

### 3. Crear archivo de configuración del frontend
En el frontend, creá `.env`:
```
VITE_API_URL=http://localhost:4000
```

### 4. Copiar `api-client.ts` a `src/lib/api-client.ts`
Es el cliente HTTP que reemplaza a `@/integrations/supabase/client`.

### 5. Reemplazar llamadas Supabase
Donde el código tenga:
```ts
const { data, error } = await supabase.from("patients").select("*");
```
Reemplazar por:
```ts
const data = await api.get("/api/patients");
```

Para tiempo real (Dashboard / Pantalla pública), donde había:
```ts
supabase.channel("surgeries").on("postgres_changes", ...).subscribe();
```
Usar:
```ts
import { socket } from "@/lib/api-client";
socket.on("surgery:update", (payload) => { /* refetch */ });
```

### 6. Auth
El login ahora llama `POST /api/auth/login`. El token JWT se guarda en
`localStorage` y se envía automáticamente en cada request.

### 7. Levantar todo
Terminal 1:
```bash
cd backend-export && npm run dev
```
Terminal 2:
```bash
cd <repo-frontend> && npm run dev
```
Frontend en `http://localhost:3000`, backend en `http://localhost:4000`.

## Mapeo de tablas → endpoints

| Supabase                           | API REST                       |
| ---------------------------------- | ------------------------------ |
| `supabase.from("patients")`        | `/api/patients`                |
| `supabase.from("surgeries")`       | `/api/surgeries`               |
| `supabase.from("operating_rooms")` | `/api/operating-rooms`         |
| `supabase.from("appointments")`    | `/api/appointments`            |
| `supabase.auth.signIn`             | `POST /api/auth/login`         |
| `supabase.auth.signUp`             | `POST /api/auth/register`      |
| `supabase.auth.getUser`            | `GET /api/auth/me`             |
| Realtime channel                   | Socket.io `surgery:update`     |
| Pantalla pública                   | `GET /api/public/board`        |
