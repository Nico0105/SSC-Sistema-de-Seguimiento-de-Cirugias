// ======================================================
// Guardia de rutas (components/ProtectedRoute.tsx)
// Envuelve las rutas del panel interno:
//   - mientras se restaura la sesión muestra un loading
//   - sin sesión redirige a /auth
//   - con sesión renderiza el contenido protegido
// ======================================================
import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { Loading } from "./ui";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Restaurando sesión…" />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
