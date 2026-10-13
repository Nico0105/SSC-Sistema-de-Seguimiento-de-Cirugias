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
      className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
