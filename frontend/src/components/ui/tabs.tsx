// ======================================================
// Tabs (components/ui/tabs.tsx)
// Pestañas accesibles sobre Radix UI. Se usan para
// reorganizar SurgeryDetail.tsx (Resumen/Checklist/
// Seguimiento/Timeline) en vez de apilar todo verticalmente.
// ======================================================
import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "../../lib/cn";

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn("inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors",
        "data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn("mt-4", className)} {...props} />;
}
