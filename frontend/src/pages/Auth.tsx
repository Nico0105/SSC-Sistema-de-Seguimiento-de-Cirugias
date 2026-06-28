import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export default function AuthPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-brand-700 mb-1">SSC</h1>
        <p className="text-sm text-slate-500 mb-6">Iniciar sesión</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
          </Field>
          <Field label="Contraseña">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="input" />
          </Field>

          {err && <div className="text-sm text-rose-600">{err}</div>}

          <button disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg py-2.5 font-medium">
            {loading ? "..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400 text-center">
          ¿No tenés cuenta? Pedile al administrador que te cree una en "Usuarios".
        </p>
      </div>

      <style>{`
        .input { width: 100%; border: 1px solid rgb(226 232 240); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }
        .input:focus { border-color: rgb(59 130 246); box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
