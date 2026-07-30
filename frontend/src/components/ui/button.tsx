// ======================================================
// Button (components/ui/button.tsx)
// Botón base de toda la app con variantes de color/tamaño
// consistentes (patrón shadcn/ui: cva + Radix Slot). Antes
// existían botones "sueltos" con clases repetidas a mano en
// cada página (crear, eliminar, editar roles, etc.) — ahora
// todos comparten esta única definición visual.
// ======================================================
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium " +
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-600 text-white hover:bg-brand-700",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        destructive: "bg-danger-600 text-white hover:bg-danger-700",
        outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        ghost: "text-slate-600 hover:bg-slate-100",
        link: "text-brand-600 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Renderiza como el elemento hijo (ej. un <Link>) en vez de un <button>. */
  asChild?: boolean;
  /** Estado ocupado: deshabilita el botón y muestra un spinner. */
  busy?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, busy, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || busy}
        {...props}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";
