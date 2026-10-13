// ======================================================
// Dialog (components/ui/dialog.tsx)
// Modal accesible sobre Radix UI (foco atrapado, cierre con
// Escape, overlay). Reemplaza los `window.confirm()` /
// `window.prompt()` / `alert()` nativos usados en
// Patients.tsx y Users.tsx para confirmaciones y reseteo de
// contraseña — esos diálogos del navegador no se pueden
// estilizar ni son consistentes entre navegadores.
// ======================================================
import { type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  className,
  children,
  title,
  description,
}: {
  className?: string;
  children: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-slate-900/20" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
          "bg-white rounded-2xl shadow-2xl p-8",
          className,
        )}
      >
        <div className="flex items-start justify-between mb-1">
          <RadixDialog.Title className="text-lg font-semibold text-slate-900">{title}</RadixDialog.Title>
          <RadixDialog.Close className="text-slate-400 hover:text-slate-600" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </RadixDialog.Close>
        </div>
        {description && (
          <RadixDialog.Description className="mt-1 mb-6 text-sm text-slate-500">
            {description}
          </RadixDialog.Description>
        )}
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const DialogClose = RadixDialog.Close;

/** Pie del diálogo: alinea los botones de acción a la derecha. */
export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-8 flex justify-end gap-3">{children}</div>;
}
