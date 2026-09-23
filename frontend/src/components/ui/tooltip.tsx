// ======================================================
// Tooltip (components/ui/tooltip.tsx)
// Ayuda contextual breve sobre Radix UI (ej. explicar por
// qué un botón está deshabilitado, o el motivo de un email
// "fallido" en EmailLogs). `TooltipProvider` se monta una
// sola vez en main.tsx.
// ======================================================
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "../../lib/cn";

export const TooltipProvider = RadixTooltip.Provider;
export const Tooltip = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;

export function TooltipContent({ className, ...props }: React.ComponentProps<typeof RadixTooltip.Content>) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        sideOffset={6}
        className={cn(
          "z-50 max-w-xs rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-md",
          className,
        )}
        {...props}
      />
    </RadixTooltip.Portal>
  );
}
