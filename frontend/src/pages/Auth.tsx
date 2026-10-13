// ======================================================
// Página de login (pages/Auth.tsx)
// Único punto de entrada al panel interno y al portal del
// paciente: logo, título, dos campos y un botón. Las cuentas
// las crea un administrador desde "Usuarios" (no hay registro
// público, según la definición funcional del sistema).
// ======================================================
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { getErrorMessage } from "../lib/api-client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ErrorAlert } from "../components/ui/alert";
import { BrandMark } from "../components/layout/BrandMark";
import { homePathFor } from "../components/RoleRoute";

export default function AuthPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión, no tiene sentido mostrar el login.
  if (user) return <Navigate to={homePathFor(user.roles)} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <BrandMark size="lg" />
        <h1 className="mt-10 text-3xl font-semibold tracking-tight text-slate-900">Iniciar sesión</h1>
        <p className="mt-2 text-slate-500">Seguimiento de cirugías especializadas.</p>

        <form onSubmit={onSubmit} className="mt-10 space-y-6">
          <Input label="Email" type="email" value={email} onChange={setEmail} required />
          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-[31px] rounded-lg p-1.5 text-slate-300 hover:text-slate-600"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <ErrorAlert message={err} />

          <Button type="submit" size="lg" className="w-full" busy={loading}>
            Entrar
          </Button>
        </form>

        <p className="mt-10 text-sm text-slate-400">
          ¿Sin cuenta? Pedísela al administrador.{" "}
          <a href="/board" className="text-slate-600 hover:text-slate-900">Sala de espera →</a>
        </p>
      </div>
    </main>
  );
}
