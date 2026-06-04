import { Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Tv,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/surgeries", label: "Cirugías", icon: Stethoscope },
  { to: "/patients", label: "Pacientes", icon: Users },
  { to: "/appointments", label: "Turnos", icon: CalendarClock },
];

export function AppShell({ children }: { children?: ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="px-6 py-5 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg grid place-items-center text-primary-foreground"
                 style={{ background: "var(--gradient-medical)" }}>
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-sidebar-foreground tracking-tight">SSC</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Cirugías Especializadas</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
          <Link
            to="/board"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
          >
            <Tv className="h-4 w-4" />
            Pantalla familiares
          </Link>
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 text-xs">
            <div className="font-medium text-sidebar-foreground truncate">{user?.email}</div>
            <div className="text-muted-foreground">Personal autorizado</div>
          </div>
          <button
            onClick={async () => { await signOut(); router.navigate({ to: "/auth" }); }}
            className="mt-1 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">{children ?? <Outlet />}</main>
    </div>
  );
}
