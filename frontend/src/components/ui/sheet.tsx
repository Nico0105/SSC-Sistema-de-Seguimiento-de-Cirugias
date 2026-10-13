// ======================================================
// Sheet (components/ui/sheet.tsx)
// Panel lateral deslizable desde la derecha, sobre Radix
// Dialog (foco atrapado, Escape, overlay). Se usa para los
// formularios de alta ("Programar intervención quirúrgica",
// "Nuevo paciente", "Nuevo turno") sin perder de vista el
// listado de fondo. Encabezado con ícono, cuerpo con scroll
// propio y pie fijo con las acciones.
// ======================================================
import type { ComponentType, ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

export const Sheet = RadixDialog.Root;

export function SheetContent({
  title,
  description,
  icon: _icon,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  /** Botones de acción, fijos al pie del panel. */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-slate-900/20" />
      <RadixDialog.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl",
          "data-[state=open]:animate-[sheet-in_200ms_ease-out]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-6">
          <div>
            <RadixDialog.Title className="text-xl font-semibold text-slate-900">{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="mt-1 text-sm text-slate-500">{description}</RadixDialog.Description>
            ) : (
              <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </RadixDialog.Close>
        </div>
        <div className="flex-1 overflow-y-auto px-8 pb-8">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-8 py-5">{footer}</div>}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const SheetClose = RadixDialog.Close;
