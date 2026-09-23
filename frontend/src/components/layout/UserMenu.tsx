// ======================================================
// UserMenu (components/layout/UserMenu.tsx)
// Reemplaza el email + "Cerrar sesión" sueltos al pie del
// sidebar por un menú desplegable (avatar con iniciales,
// roles, cerrar sesión). Vive al pie del Sidebar.
// ======================================================
import { LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { ROLE_LABEL, type Role } from "../../lib/permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/** Iniciales del usuario para el avatar (ej. "Ana Gómez" → "AG"). */
function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ collapsed }: { collapsed?: boolean }) {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const roleLabels = user.roles.map((r) => ROLE_LABEL[r as Role] ?? r).join(", ");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-3 w-full rounded-lg px-2 py-2 hover:bg-slate-50 transition text-left"
          aria-label="Menú de usuario"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
            {getInitials(user.fullName)}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-700 truncate">{user.fullName}</span>
              <span className="block text-xs text-slate-400 truncate">{roleLabels}</span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-slate-800 truncate">{user.fullName}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
