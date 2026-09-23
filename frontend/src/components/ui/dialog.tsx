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
      <RadixDialog.Overlay className="fixed inset-0 bg-slate-900/40 animate-in fade-in z-40" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
          "bg-white rounded-2xl shadow-lg border border-slate-200 p-6",
          className,
        )}
      >
        <div className="flex items-start justify-between mb-1">
          <RadixDialog.Title className="font-semibold text-slate-800">{title}</RadixDialog.Title>
          <RadixDialog.Close className="text-slate-400 hover:text-slate-600" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </RadixDialog.Close>
        </div>
        {description && (
          <RadixDialog.Description className="text-sm text-slate-500 mb-4">
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
  return <div className="flex justify-end gap-2 mt-5">{children}</div>;
}
