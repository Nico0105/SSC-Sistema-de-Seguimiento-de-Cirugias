// ======================================================
// Contexto de autenticación (lib/auth-context.tsx)
// Mantiene el usuario de la sesión en memoria y lo expone
// a toda la app vía el hook `useAuth()`.
// - Al montar, intenta restaurar la sesión desde el token
//   guardado en localStorage.
// - Escucha el evento global "ssc:unauthorized" (emitido por
//   api-client ante un 401) para cerrar sesión automáticamente
//   cuando el token vence o el usuario es desactivado.
// ======================================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth, UNAUTHORIZED_EVENT, type User } from "./api-client";
import { registerWebPush } from "./push";

interface AuthCtx {
  /** Usuario autenticado, o null si no hay sesión. */
  user: User | null;
  /** true mientras se restaura la sesión inicial (evita parpadeos de login). */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restauración de sesión al cargar la app. El finally garantiza que
  // `loading` termine incluso si la petición falla (backend caído, etc.).
  useEffect(() => {
    auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Con sesión activa se intenta registrar el push web (FCM).
  // Es un no-op si Firebase no está configurado en el .env.
  useEffect(() => {
    if (user) void registerWebPush();
  }, [user]);

  // Cierre de sesión automático cuando el backend rechaza el token.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const logged = await auth.login(email, password);
    setUser(logged);
    void registerWebPush();
  }, []);

  const signOut = useCallback(() => {
    auth.signOut();
    setUser(null);
  }, []);

  // useMemo evita recrear el objeto en cada render y re-renderizar
  // innecesariamente a todos los consumidores del contexto.
  const value = useMemo<AuthCtx>(
    () => ({ user, loading, login, signOut }),
    [user, loading, login, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Acceso al contexto de auth. Debe usarse dentro de <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
