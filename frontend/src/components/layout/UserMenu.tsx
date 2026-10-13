// ======================================================
// UserMenu (components/layout/UserMenu.tsx)
// Avatar con iniciales en la barra superior azul. Al hacer clic
// despliega lo secundario (divulgación progresiva): nombre,
// email y roles, estado de la conexión en tiempo real, acceso
// a la pantalla de sala de espera y "Cerrar sesión".
// ======================================================
import { LogOut, MonitorPlay } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { ROLE_LABEL, can, type Role } from "../../lib/permissions";
import { useSocketStatus } from "../../hooks/use-socket-status";
import { cn } from "../../lib/cn";
import { Avatar } from "../ui/identity";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { connected } = useSocketStatus();
  if (!user) return null;

  const roleLabels = user.roles.map((r) => ROLE_LABEL[r as Role] ?? r).join(", ");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 rounded-full p-0.5 pr-1 hover:bg-white/10" aria-label="Menú de usuario">
          <span className="hidden text-right lg:block">
            <span className="block max-w-[180px] truncate text-sm font-medium text-white">{user.fullName}</span>
          </span>
          <Avatar name={user.fullName} size="sm" className="bg-white/15 text-white" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-3 py-2.5">
          <p className="truncate text-sm font-medium text-slate-900">{user.fullName}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <p className="mt-1 text-xs text-slate-400">{roleLabels}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-amber-400")} />
            {connected ? "Sincronizado en tiempo real" : "Reconectando…"}
          </p>
        </div>
        <DropdownMenuSeparator />
        {can(user.roles, "panel:ver") && (
          <DropdownMenuItem asChild>
            <a href="/board" target="_blank" rel="noreferrer">
              <MonitorPlay className="h-4 w-4" />
              Pantalla de sala de espera
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem destructive onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
