// ======================================================
// Toasts (lib/toast.ts)
// Wrapper fino sobre sonner con el estilo del SSC. Se usa en
// las mutaciones (crear/editar/eliminar) para dar feedback
// inmediato sin ocupar espacio de layout — a diferencia de
// ErrorAlert, que se reserva para errores de VALIDACIÓN
// dentro de un formulario todavía abierto.
// ======================================================
import { toast as sonnerToast } from "sonner";
import { getErrorMessage } from "./api-client";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (error: unknown) => sonnerToast.error(getErrorMessage(error)),
  info: (message: string) => sonnerToast(message),
};
