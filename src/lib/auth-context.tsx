import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "administrativo" | "jefe_quirofano" | "medico" | "paciente";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  roles: [],
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        setTimeout(() => loadRoles(sess.user.id), 0);
      } else {
        setRoles([]);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadRoles(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadRoles(uid: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data?.map((r) => r.role as AppRole)) ?? []);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, roles, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
