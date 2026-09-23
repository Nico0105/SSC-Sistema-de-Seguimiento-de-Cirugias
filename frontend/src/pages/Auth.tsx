// ======================================================
// Página de login (pages/Auth.tsx)
// Único punto de entrada al panel interno. Las cuentas las
// crea un administrador desde "Usuarios" (no hay registro
// público, según la definición funcional del sistema).
// ======================================================
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { getErrorMessage } from "../lib/api-client";
import { ErrorAlert, Input, PrimaryButton } from "../components/ui";

export default function AuthPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión, no tiene sentido mostrar el login.
  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-brand-700 mb-1">SSC</h1>
        <p className="text-sm text-slate-500 mb-6">Iniciar sesión</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={setEmail} required />
          <Input label="Contraseña" type="password" value={password} onChange={setPassword} required minLength={8} />

          <ErrorAlert message={err} />

          <div className="w-full [&>button]:w-full">
            <PrimaryButton busy={loading}>Entrar</PrimaryButton>
          </div>
        </form>

        <p className="mt-4 text-xs text-slate-400 text-center">
          ¿No tenés cuenta? Pedile al administrador que te cree una en "Usuarios".
        </p>
      </div>
    </div>
  );
}
