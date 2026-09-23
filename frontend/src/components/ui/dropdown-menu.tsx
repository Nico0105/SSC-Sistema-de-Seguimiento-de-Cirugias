// ======================================================
// DropdownMenu (components/ui/dropdown-menu.tsx)
// Menú contextual sobre Radix UI. Reemplaza las listas de
// links de acción sueltos al final de cada fila de tabla
// (ej. "Editar roles · Resetear pass · Desactivar" en
// Users.tsx) por un único botón "⋯" con las acciones
// agrupadas — más limpio y escalable si se agregan más.
// ======================================================
import type { ReactNode } from "react";
import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "../../lib/cn";

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({ children, align = "end" }: { children: ReactNode; align?: "start" | "end" }) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align={align}
        sideOffset={4}
        className="z-50 min-w-[180px] rounded-lg border border-slate-200 bg-white p-1 shadow-md"
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof RadixDropdown.Item> & { destructive?: boolean }) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none cursor-pointer",
        destructive ? "text-danger-600 hover:bg-danger-50" : "text-slate-700 hover:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator() {
  return <RadixDropdown.Separator className="my-1 h-px bg-slate-100" />;
}
