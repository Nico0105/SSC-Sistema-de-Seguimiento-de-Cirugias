// ======================================================
// Guardia por rol (components/RoleRoute.tsx)
// Complementa a ProtectedRoute: además de exigir sesión,
// exige que el usuario tenga alguno de los roles indicados.
// Si no los tiene, lo redirige a su pantalla de inicio
// (el paciente a su portal, el staff al dashboard).
// La autorización real siempre la valida el backend.
// ======================================================
import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { hasAnyRole, PATIENT_ROLES, type Role } from "../lib/permissions";

export default function RoleRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!hasAnyRole(user?.roles, roles)) {
    const home = hasAnyRole(user?.roles, PATIENT_ROLES) ? "/my-care" : "/dashboard";
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
}
