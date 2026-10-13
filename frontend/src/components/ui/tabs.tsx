// ======================================================
// Tabs (components/ui/tabs.tsx)
// Pestañas accesibles sobre Radix UI con dos estilos:
//   - "pill" (por defecto): segmentado gris, para filtros de panel.
//   - "underline": subrayado azul marino, como las pestañas de
//     la historia clínica ("Resumen quirúrgico · Síntomas · …").
// ======================================================
import { createContext, useContext } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "../../lib/cn";

export const Tabs = RadixTabs.Root;

type TabsVariant = "pill" | "underline";
const VariantCtx = createContext<TabsVariant>("pill");

export function TabsList({
  className,
  variant = "pill",
  ...props
}: React.ComponentProps<typeof RadixTabs.List> & { variant?: TabsVariant }) {
  return (
    <VariantCtx.Provider value={variant}>
      <RadixTabs.List
        className={cn(
          variant === "pill"
            ? "inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
            : "flex items-center overflow-x-auto border-b border-slate-200/70",
          className,
        )}
        {...props}
      />
    </VariantCtx.Provider>
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof RadixTabs.Trigger>) {
  const variant = useContext(VariantCtx);
  return (
    <RadixTabs.Trigger
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors",
        variant === "pill"
          ? "rounded-md px-3 py-1.5 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-navy-800 data-[state=active]:shadow-sm"
          : "-mb-px border-b-2 border-transparent px-1 py-3 mr-6 font-normal text-slate-400 hover:text-slate-700 data-[state=active]:border-slate-900 data-[state=active]:font-medium data-[state=active]:text-slate-900",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn("mt-8 outline-none", className)} {...props} />;
}
