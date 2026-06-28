import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { ADMIN_ROLES, hasAnyRole, type Role } from "../lib/permissions";

const nav: { to: string; label: string; roles?: Role[] }[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/surgeries", label: "Cirugías" },
  { to: "/patients", label: "Pacientes" },
  { to: "/appointments", label: "Turnos" },
  { to: "/users", label: "Usuarios", roles: ADMIN_ROLES },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const visibleNav = nav.filter((n) => !n.roles || hasAnyRole(user?.roles, n.roles));
  return (
    <div className="min-h-full flex">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="text-xl font-bold text-brand-700 mb-8">SSC</div>
        <nav className="flex-1 space-y-1">
          {visibleNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <a
            href="/board"
            target="_blank"
            rel="noreferrer"
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Pantalla pública ↗
          </a>
        </nav>
        <div className="border-t border-slate-200 pt-4 mt-4">
          <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          <div className="text-xs text-slate-400 mb-2">{user?.roles.join(", ")}</div>
          <button
            onClick={signOut}
            className="text-sm text-rose-600 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
