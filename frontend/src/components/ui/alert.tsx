// ======================================================
// ErrorAlert (components/ui/alert.tsx)
// Aviso de error de formulario/operación, accesible
// (role="alert" para lectores de pantalla). Se mantiene para
// errores de VALIDACIÓN de formulario; los errores de
// mutaciones puntuales (crear/editar/eliminar) pasan a usar
// toasts de sonner (ver lib/toast.ts) para no duplicar el
// mensaje en dos lugares a la vez.
// ======================================================
import { AlertCircle } from "lucide-react";

export function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 text-sm text-danger-700 bg-danger-50 border border-danger-100 rounded-lg px-3 py-2"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
