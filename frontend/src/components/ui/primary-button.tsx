// ======================================================
// PrimaryButton (components/ui/primary-button.tsx)
// Alias del Button con variant="default" para no romper las
// ~10 páginas que ya lo usan como <PrimaryButton busy={...}>.
// Nuevo código debería usar <Button> directamente.
// ======================================================
import { Button, type ButtonProps } from "./button";

export function PrimaryButton({ children, busy, ...props }: ButtonProps) {
  return (
    <Button busy={busy} {...props}>
      {busy ? "Guardando…" : children}
    </Button>
  );
}
