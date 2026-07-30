// ======================================================
// Dashboard (pages/Dashboard.tsx)
// Resumen operativo del día a día: KPIs con ícono y color
// semántico, y la tabla completa con buscador/paginación
// (DataTable). Se refresca solo ante cambios en tiempo real
// (useSurgeriesQuery invalida la caché ante eventos del socket).
// ======================================================
import { useMemo } from "react";
import { CalendarClock, CheckCircle2, ClipboardList, DoorOpen } from "lucide-react";
import { useSurgeriesQuery } from "../hooks/use-surgeries-query";
import { ErrorAlert, StatusBadge } from "../components/ui";
import { Card } from "../components/ui/card";
import { DataTable } from "../components/ui/data-table";
import { getErrorMessage } from "../lib/api-client";
import { STATUS_LABEL } from "../lib/surgery-status";
import type { Surgery } from "../lib/types";
import type { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<Surgery, any>[] = [
  {
    accessorKey: "publicCode",
    header: "Código",
    cell: (ctx) => <span className="font-mono text-xs">{ctx.getValue() as string}</span>,
  },
  {
    id: "patient",
    accessorFn: (s) => `${s.patient.lastName}, ${s.patient.firstName}`,
    header: "Paciente",
  },
  { accessorKey: "procedure", header: "Procedimiento" },
  {
    id: "operatingRoom",
    accessorFn: (s) => s.operatingRoom?.code ?? "—",
    header: "Quirófano",
  },
  {
    id: "status",
    accessorFn: (s) => STATUS_LABEL[s.status],
    header: "Estado",
    cell: (ctx) => <StatusBadge status={ctx.row.original.status} />,
  },
];

export default function Dashboard() {
  const { data: surgeries = [], isLoading, error } = useSurgeriesQuery();

  // Las métricas sólo se recalculan cuando cambia la lista.
  const stats = useMemo(
    () => ({
      total: surgeries.length,
      enQuirofano: surgeries.filter((s) => s.status === "en_quirofano").length,
      programadas: surgeries.filter((s) => s.status === "programada").length,
      alta: surgeries.filter((s) => s.status === "alta").length,
    }),
    [surgeries],
  );

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">Resumen operativo de cirugías en curso.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={ClipboardList} label="Total cirugías" value={stats.total} variant="brand" />
        <KpiCard icon={DoorOpen} label="En quirófano" value={stats.enQuirofano} variant="warning" />
        <KpiCard icon={CalendarClock} label="Programadas" value={stats.programadas} variant="info" />
        <KpiCard icon={CheckCircle2} label="Altas" value={stats.alta} variant="success" />
      </div>

      {error && (
        <div className="mb-6">
          <ErrorAlert message={getErrorMessage(error)} />
        </div>
      )}

      <Card>
        <div className="px-6 pt-4">
          <h2 className="font-semibold text-slate-800">Cirugías</h2>
        </div>
        <DataTable
          columns={columns}
          data={surgeries}
          isLoading={isLoading}
          searchPlaceholder="Buscar por código, paciente o procedimiento…"
          emptyMessage="Sin cirugías cargadas"
        />
      </Card>
    </div>
  );
}

/** Tarjeta de métrica del encabezado del dashboard, con ícono y color semántico. */
function KpiCard({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  variant: "brand" | "warning" | "info" | "success";
}) {
  const styles = {
    brand: { bg: "bg-brand-50", icon: "text-brand-600", value: "text-brand-700" },
    warning: { bg: "bg-warning-50", icon: "text-warning-600", value: "text-warning-700" },
    info: { bg: "bg-info-50", icon: "text-info-600", value: "text-info-700" },
    success: { bg: "bg-success-50", icon: "text-success-600", value: "text-success-700" },
  }[variant];

  return (
    <Card className="p-5">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${styles.bg} mb-3`}>
        <Icon className={`h-4.5 w-4.5 ${styles.icon}`} />
      </div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${styles.value}`}>{value}</div>
    </Card>
  );
}
