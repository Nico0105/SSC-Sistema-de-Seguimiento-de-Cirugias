// ======================================================
// Badge (components/ui/badge.tsx)
// Etiqueta de color genérica. Reemplaza los mapas de color
// duplicados que existían en StatusBadge, PostopPanel,
// EmailLogs y MyCare — cada uno ahora sólo decide QUÉ
// variante usar según lib/status-config.ts, no cómo se ve.
// ======================================================
import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-slate-100 text-slate-700",
        brand: "bg-brand-50 text-brand-700",
        info: "bg-info-100 text-info-700",
        success: "bg-success-100 text-success-700",
        warning: "bg-warning-100 text-warning-700",
        danger: "bg-danger-100 text-danger-700",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        lg: "px-4 py-2 text-base",
      },
    },
    defaultVariants: { variant: "neutral", size: "sm" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
