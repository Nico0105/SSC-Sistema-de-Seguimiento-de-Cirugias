// ======================================================
// Cliente API de la app móvil (src/api.ts)
// Único punto de acceso al backend desde React Native:
//   - Sesión JWT persistida en el almacenamiento SEGURO del
//     dispositivo (expo-secure-store, cifrado por el SO).
//   - login / renovación de token / logout.
//   - Wrapper de fetch que adjunta el JWT y traduce errores.
// ======================================================
import * as SecureStore from 'expo-secure-store';

// URL del backend. En un dispositivo físico reemplazar por la IP
// local de la máquina que corre el backend (ej. http://192.168.0.10:4000).
export const API_URL = 'http://localhost:4000';

const TOKEN_KEY = 'ssc_token';

/** Token en memoria (espejo de lo guardado en SecureStore). */
let currentToken: string | null = null;

/** Restaura el token guardado al abrir la app. */
export async function loadStoredToken(): Promise<string | null> {
  currentToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return currentToken;
}

/** Persiste (o borra) el token de sesión en el almacenamiento seguro. */
async function persistToken(token: string | null): Promise<void> {
  currentToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/** Error de API con código HTTP y mensaje del backend. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Convierte cualquier error en un mensaje mostrable. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado';
}

/** Petición JSON al backend con el JWT de la sesión. */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Error ${res.status}` }));
    throw new ApiError(res.status, (err as { error?: string }).error ?? `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b),
  patch: <T>(p: string, b?: unknown) => request<T>('PATCH', p, b),
  delete: <T>(p: string, b?: unknown) => request<T>('DELETE', p, b),
};

// ------------------------------------------------------
// Sesión
// ------------------------------------------------------

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  patientId?: string | null;
}

export const auth = {
  /** Inicia sesión y persiste el JWT en el dispositivo. */
  async login(email: string, password: string): Promise<SessionUser> {
    const data = await api.post<{ token: string; user: SessionUser }>('/api/auth/login', {
      email,
      password,
    });
    await persistToken(data.token);
    return data.user;
  },

  /**
   * Restaura la sesión al abrir la app: si hay token guardado lo RENUEVA
   * contra el backend (extiende la expiración y refresca los roles).
   * Devuelve null si no hay sesión o el token ya no es válido.
   */
  async restore(): Promise<SessionUser | null> {
    const stored = await loadStoredToken();
    if (!stored) return null;
    try {
      const data = await api.post<{ token: string; user: SessionUser }>('/api/auth/refresh');
      await persistToken(data.token); // token renovado
      // /auth/me agrega patientId (necesario para el portal del paciente).
      return await api.get<SessionUser>('/api/auth/me');
    } catch {
      await persistToken(null);
      return null;
    }
  },

  /** Cierra la sesión localmente (borra el token del dispositivo). */
  async signOut(): Promise<void> {
    await persistToken(null);
  },
};
