import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [session, loading, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Sesión iniciada");
  }
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectTo, data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Cuenta creada. Si la confirmación por email está habilitada, revisá tu casilla.");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground"
           style={{ background: "var(--gradient-medical)" }}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur grid place-items-center">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-semibold">SSC</div>
            <div className="text-xs opacity-80">Sistema de Seguimiento de Cirugías</div>
          </div>
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            Monitoreo quirúrgico en tiempo real para tu institución.
          </h1>
          <p className="text-base opacity-90">
            Coordiná pacientes, cirugías, quirófanos y comunicación con familiares
            desde una sola plataforma clara y segura.
          </p>
        </div>
        <div className="text-xs opacity-75">© SSC · Plataforma médica</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Acceso al sistema</h2>
            <p className="text-sm text-muted-foreground mt-1">Personal administrativo y médico.</p>
          </div>
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Ingresar</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@hospital.com" /></Field>
                <Field label="Contraseña"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
                <Button type="submit" disabled={busy} className="w-full">{busy ? "Ingresando..." : "Ingresar"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <Field label="Nombre completo"><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
                <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Field label="Contraseña"><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
                <Button type="submit" disabled={busy} className="w-full">{busy ? "Creando..." : "Crear cuenta"}</Button>
                <p className="text-xs text-muted-foreground">El primer usuario será administrador. Los siguientes ingresan como personal administrativo.</p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>;
}
