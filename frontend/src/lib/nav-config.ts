// ======================================================
// Configuración de navegación (lib/nav-config.ts)
// Fuente única del menú lateral: agrupa los ítems por
// sección (Operación / Pacientes / Administración /
// Autogestión) con su ícono y el permiso necesario para verlos.
// Separado de AppShell.tsx para que Sidebar (desktop) y el
// drawer mobile compartan exactamente la misma data.
// ======================================================
import {
  CalendarClock,
  LayoutDashboard,
  Mail,
  ScrollText,
  Stethoscope,
  UserCog,
  Users,
} from "lucide-react";
import type { Permission } from "./permissions";
import type { ComponentType } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Permiso necesario para ver el ítem (lib/permissions.ts). */
  permission: Permission;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Operación",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "panel:ver" },
      { to: "/surgeries", label: "Cirugías", icon: Stethoscope, permission: "panel:ver" },
      { to: "/appointments", label: "Turnos", icon: CalendarClock, permission: "panel:ver" },
    ],
  },
  {
    label: "Pacientes",
    items: [{ to: "/patients", label: "Pacientes", icon: Users, permission: "panel:ver" }],
  },
  {
    label: "Administración",
    items: [
      { to: "/users", label: "Usuarios", icon: UserCog, permission: "usuarios:gestionar" },
      { to: "/emails", label: "Emails", icon: Mail, permission: "emails:ver" },
    ],
  },
  {
    label: "Mi cuenta",
    items: [{ to: "/my-care", label: "Mi seguimiento", icon: ScrollText, permission: "portal:paciente" }],
  },
];
