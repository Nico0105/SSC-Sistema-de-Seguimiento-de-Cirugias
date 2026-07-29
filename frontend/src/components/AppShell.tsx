// ======================================================
// Layout del panel interno (components/AppShell.tsx)
// Sidebar con la navegación principal (filtrada según los
// roles del usuario), acceso a la pantalla pública, datos
// de la sesión y botón de cierre de sesión. El contenido
// de cada página se renderiza en el <Outlet /> de React Router.
// ======================================================
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { ADMIN_ROLES, ROLE_LABEL, hasAnyRole, type Role } from "../lib/permissions";

/** Ítems de navegación; `roles` restringe la visibilidad del ítem. */
const NAV_ITEMS: { to: string; label: string; roles?: Role[] }[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/surgeries", label: "Cirugías" },
  { to: "/patients", label: "Pacientes" },
  { to: "/appointments", label: "Turnos" },
  { to: "/users", label: "Usuarios", roles: ADMIN_ROLES },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const visibleNav = NAV_ITEMS.filter((n) => !n.roles || hasAnyRole(user?.roles, n.roles));

  return (
    // En pantallas chicas el sidebar pasa arriba (columna); en md+ queda fijo a la izquierda.
    <div className="min-h-full flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col shrink-0">
        <div className="text-xl font-bold text-brand-700 mb-8">SSC</div>

        <nav className="flex-1 space-y-1" aria-label="Navegación principal">
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
          {/* La pantalla pública se abre en otra pestaña (para la sala de espera). */}
          <a
            href="/board"
            target="_blank"
            rel="noreferrer"
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Pantalla pública ↗
          </a>
        </nav>

        {/* Sesión actual */}
        <div className="border-t border-slate-200 pt-4 mt-4">
          <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          <div className="text-xs text-slate-400 mb-2">
            {user?.roles.map((r) => ROLE_LABEL[r as Role] ?? r).join(", ")}
          </div>
          <button onClick={signOut} className="text-sm text-rose-600 hover:underline">
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
