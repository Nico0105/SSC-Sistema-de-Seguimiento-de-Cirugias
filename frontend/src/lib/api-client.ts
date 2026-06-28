import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "ssc_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

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
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get:    <T>(p: string)              => request<T>("GET",    p),
  post:   <T>(p: string, b?: unknown) => request<T>("POST",   p, b),
  patch:  <T>(p: string, b?: unknown) => request<T>("PATCH",  p, b),
  delete: <T>(p: string)              => request<T>("DELETE", p),
};

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export const auth = {
  async login(email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>("/api/auth/login", { email, password });
    setToken(data.token);
    return data.user;
  },
  async me() {
    if (!getToken()) return null;
    try { return await api.get<User>("/api/auth/me"); }
    catch { setToken(null); return null; }
  },
  signOut() { setToken(null); },
};

let socketInstance: Socket | null = null;
export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(API_URL, { transports: ["websocket", "polling"] });
  }
  return socketInstance;
}
