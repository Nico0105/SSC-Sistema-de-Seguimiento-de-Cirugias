// ======================================================
// Cliente HTTP + sesión + tiempo real (lib/api-client.ts)
// Único punto de acceso del frontend al backend:
//   - `api`: wrapper de fetch que adjunta el JWT y traduce
//     errores HTTP a excepciones tipadas (ApiError).
//   - `auth`: login / restauración de sesión / logout.
//   - `getSocket`: conexión singleton de Socket.io para
//     recibir eventos de tiempo real.
// Si el backend responde 401 (token vencido o usuario
// desactivado) se limpia la sesión y se notifica a la app
// mediante el evento "ssc:unauthorized".
// ======================================================
import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "ssc_token";

/** Evento global que dispara el cierre de sesión automático ante un 401. */
export const UNAUTHORIZED_EVENT = "ssc:unauthorized";

/** Error de API con el código HTTP y el mensaje devuelto por el backend. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Convierte cualquier error atrapado en un mensaje mostrable al usuario. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * Ejecuta una petición JSON contra el backend.
 * Adjunta el JWT si existe y lanza ApiError si la respuesta no es 2xx.
 */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // Sesión inválida (token vencido / usuario desactivado): se limpia el
    // token y se avisa al AuthProvider para redirigir al login.
    // El propio login (401 por credenciales) queda excluido.
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, err.error ?? `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Métodos HTTP tipados: `api.get<Paciente[]>("/api/patients")`. */
export const api = {
  get:    <T>(p: string)              => request<T>("GET",    p),
  post:   <T>(p: string, b?: unknown) => request<T>("POST",   p, b),
  patch:  <T>(p: string, b?: unknown) => request<T>("PATCH",  p, b),
  delete: <T>(p: string)              => request<T>("DELETE", p),
};

/** Usuario autenticado tal como lo devuelve el backend. */
export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export const auth = {
  /** Inicia sesión, guarda el token y devuelve el usuario. */
  async login(email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>("/api/auth/login", { email, password });
    setToken(data.token);
    return data.user;
  },
  /**
   * Restaura la sesión a partir del token guardado (o null si no hay).
   *
   * Antes de usarlo, RENUEVA el token contra /api/auth/refresh: el JWT
   * guardado lleva los roles "congelados" desde el momento del login (el
   * backend valida permisos decodificando el token, no consultando la
   * base en cada request), así que si un admin cambió tus roles después
   * de que iniciaste sesión, seguirías operando con permisos viejos hasta
   * volver a loguearte. Renovar acá evita ese desfasaje sin pedirle al
   * usuario que cierre sesión manualmente (mismo patrón que ya usa la
   * app móvil en `auth.restore()`).
   */
  async me() {
    if (!getToken()) return null;
    try {
      const refreshed = await api.post<{ token: string; user: User }>("/api/auth/refresh");
      setToken(refreshed.token);
      return await api.get<User>("/api/auth/me");
    } catch {
      setToken(null);
      return null;
    }
  },
  /** Cierra la sesión localmente. */
  signOut() { setToken(null); },
};

// ------------------------------------------------------
// Socket.io: conexión singleton compartida por toda la app
// ------------------------------------------------------
let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(API_URL, { transports: ["websocket", "polling"] });
  }
  return socketInstance;
}
