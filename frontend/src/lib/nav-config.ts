// ======================================================
// Configuración de navegación (lib/nav-config.ts)
// Fuente única del menú principal: cada ítem con su ícono y
// el permiso necesario para verlo. La usa la barra de
// navegación superior con efecto gota (components/layout/DropNav.tsx).
// ======================================================
import {
  BellRing,
  CalendarDays,
  HeartPulse,
  House,
  Stethoscope,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "./permissions";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Permiso necesario para ver el ítem (lib/permissions.ts). */
  permission: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Inicio", icon: House, permission: "panel:ver" },
  { to: "/surgeries", label: "Cirugías", icon: Stethoscope, permission: "panel:ver" },
  { to: "/patients", label: "Pacientes", icon: Users, permission: "panel:ver" },
  { to: "/appointments", label: "Agenda", icon: CalendarDays, permission: "panel:ver" },
  { to: "/emails", label: "Notificaciones", icon: BellRing, permission: "emails:ver" },
  { to: "/users", label: "Usuarios", icon: UserCog, permission: "usuarios:gestionar" },
  // Portal de autogestión (sólo cuentas con rol paciente).
  { to: "/my-care", label: "Mi seguimiento", icon: HeartPulse, permission: "portal:paciente" },
];
