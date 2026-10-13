// ======================================================
// Guardia por permiso (components/RoleRoute.tsx)
// Complementa a ProtectedRoute: además de exigir sesión,
// exige que el usuario tenga el permiso indicado (según la
// matriz de lib/permissions.ts). Si no lo tiene, lo redirige
// a su pantalla de inicio (el paciente a su portal, el staff
// al dashboard). La autorización real la valida el backend.
// ======================================================
import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { can, type Permission } from "../lib/permissions";

/** Pantalla de inicio de cada usuario según sus permisos. */
export function homePathFor(roles: string[] | undefined): string {
  return can(roles, "panel:ver") ? "/dashboard" : "/my-care";
}

export default function RoleRoute({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { user } = useAuth();
  if (!can(user?.roles, permission)) {
    return <Navigate to={homePathFor(user?.roles)} replace />;
  }
  return <>{children}</>;
}
