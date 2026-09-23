// ======================================================
// Sidebar (components/layout/Sidebar.tsx)
// Contenido del menú lateral: logo, secciones de navegación
// (agrupadas por lib/nav-config.ts, filtradas por rol),
// acceso a la pantalla pública, toggle de colapsar y el
// UserMenu al pie. Lo usan tanto el layout de escritorio
// (fijo) como el drawer mobile (superpuesto) en AppShell.
// ======================================================
import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, ExternalLink } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { hasAnyRole } from "../../lib/permissions";
import { NAV_SECTIONS } from "../../lib/nav-config";
import { cn } from "../../lib/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { UserMenu } from "./UserMenu";

export function Sidebar({
  collapsed = false,
  onToggleCollapsed,
}: {
  collapsed?: boolean;
  /** Sólo se pasa en desktop; el drawer mobile no tiene botón de colapsar. */
  onToggleCollapsed?: () => void;
}) {
  const { user } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-2 px-4 pt-6 pb-4", collapsed && "justify-center px-0")}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold shrink-0">
          S
        </div>
        {!collapsed && <span className="text-lg font-bold text-brand-700">SSC</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-5" aria-label="Navegación principal">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => hasAnyRole(user?.roles, item.roles));
          if (items.length === 0) return null;
          return (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavItemLink key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          );
        })}

        {/* La pantalla pública se abre en otra pestaña (para la sala de espera). */}
        <NavRow
          icon={ExternalLink}
          label="Pantalla pública"
          collapsed={collapsed}
          as="a"
          href="/board"
          target="_blank"
          rel="noreferrer"
        />
      </nav>

      <div className="border-t border-slate-100 p-3 space-y-1">
        <UserMenu collapsed={collapsed} />
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="hidden md:flex items-center gap-2 w-full rounded-lg px-2 py-2 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && "Colapsar"}
          </button>
        )}
      </div>
    </div>
  );
}

/** Ítem de navegación con indicador de página activa (barra + fondo). */
function NavItemLink({ item, collapsed }: { item: (typeof NAV_SECTIONS)[number]["items"][number]; collapsed: boolean }) {
  const link = (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
          collapsed && "justify-center px-0",
          isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-600" />
          )}
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

/** Fila con la misma forma visual que un NavItem, pero para un link externo. */
function NavRow({
  icon: Icon,
  label,
  collapsed,
  ...anchorProps
}: {
  icon: typeof ExternalLink;
  label: string;
  collapsed: boolean;
  as: "a";
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const content = (
    <a
      {...anchorProps}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </a>
  );
  if (!collapsed) return content;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
