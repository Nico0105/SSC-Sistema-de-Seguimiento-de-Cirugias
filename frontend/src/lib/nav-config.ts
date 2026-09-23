// ======================================================
// Configuración de navegación (lib/nav-config.ts)
// Fuente única del menú lateral: agrupa los ítems por
// sección (Operación / Pacientes / Administración /
// Autogestión) con su ícono y los roles que pueden verlos.
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
import { ABM_ROLES, ADMIN_ROLES, PATIENT_ROLES, STAFF_ROLES, type Role } from "./permissions";
import type { ComponentType } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: Role[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Operación",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: STAFF_ROLES },
      { to: "/surgeries", label: "Cirugías", icon: Stethoscope, roles: STAFF_ROLES },
      { to: "/appointments", label: "Turnos", icon: CalendarClock, roles: STAFF_ROLES },
    ],
  },
  {
    label: "Pacientes",
    items: [{ to: "/patients", label: "Pacientes", icon: Users, roles: STAFF_ROLES }],
  },
  {
    label: "Administración",
    items: [
      { to: "/users", label: "Usuarios", icon: UserCog, roles: ADMIN_ROLES },
      { to: "/emails", label: "Emails", icon: Mail, roles: ABM_ROLES },
    ],
  },
  {
    label: "Mi cuenta",
    items: [{ to: "/my-care", label: "Mi seguimiento", icon: ScrollText, roles: PATIENT_ROLES }],
  },
];
