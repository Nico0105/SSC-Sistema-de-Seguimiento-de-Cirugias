// ======================================================
// Barrel de compatibilidad (components/ui.tsx)
// Los primitivos de UI se dividieron en components/ui/*.tsx
// (patrón shadcn/ui: un archivo por componente). Este barrel
// re-exporta todo bajo el import original ("../components/ui")
// para que las páginas no migradas todavía sigan funcionando
// sin cambios mientras se refactorizan fase a fase.
// Código nuevo debería importar directo de components/ui/*.
// ======================================================
export { Button, buttonVariants, type ButtonProps } from "./ui/button";
export { PrimaryButton } from "./ui/primary-button";
export { Badge, badgeVariants, type BadgeProps } from "./ui/badge";
export { StatusBadge } from "./ui/status-badge";
export { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
export { Dialog, DialogTrigger, DialogContent, DialogClose, DialogFooter } from "./ui/dialog";
export { ConfirmDialog } from "./ui/confirm-dialog";
export { Skeleton, TableSkeleton } from "./ui/skeleton";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
export { Input } from "./ui/input";
export { Select } from "./ui/select";
export { ErrorAlert } from "./ui/alert";
export { Loading } from "./ui/spinner";
export { TableCard, EmptyRow } from "./ui/table";
