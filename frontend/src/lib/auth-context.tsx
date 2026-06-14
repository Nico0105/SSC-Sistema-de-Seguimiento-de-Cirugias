import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, type User } from "./api-client";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.me().then((u) => { setUser(u); setLoading(false); });
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    async login(email, password) { setUser(await auth.login(email, password)); },
    async register(email, password, fullName) { setUser(await auth.register(email, password, fullName)); },
    signOut() { auth.signOut(); setUser(null); },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
