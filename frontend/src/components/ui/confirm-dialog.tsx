// ======================================================
// ConfirmDialog (components/ui/confirm-dialog.tsx)
// Diálogo de confirmación reutilizable para acciones
// destructivas o sensibles (eliminar paciente, desactivar
// usuario). Sustituye a `window.confirm()`, que además de
// verse feo, en algunos navegadores mobile es difícil de
// leer y no se puede automatizar en tests.
// ======================================================
import { type ReactNode } from "react";
import { Dialog, DialogContent, DialogFooter } from "./dialog";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  variant = "default",
  busy,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  busy?: boolean;
  onConfirm: () => void;
  /** Contenido adicional dentro del diálogo (ej. un input de contraseña). */
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description}>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant={variant} onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
