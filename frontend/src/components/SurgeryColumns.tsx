// ======================================================
// Columnas de tablas de cirugías (components/SurgeryColumns.tsx)
// Definición compartida (TanStack Table) para la agenda del
// día del Inicio y el listado completo de Cirugías. Sólo lo
// necesario para decidir: horario, código, paciente,
// procedimiento, quirófano y estado. El resto (DNI, edad,
// horarios reales) está en el detalle de la cirugía.
// ======================================================
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { STATUS_LABEL } from "../lib/surgery-status";
import { isDelayed } from "../lib/room-status";
import { formatDate, formatTime, isToday, minutesBetween } from "../lib/format";
import { CodeChip, RoomChip } from "./ui/identity";
import { StatusBadge } from "./ui/status-badge";
import type { Surgery } from "../lib/types";

export function buildSurgeryColumns({ showDate }: { showDate: boolean }): ColumnDef<Surgery, any>[] {
  return [
    {
      id: "schedule",
      accessorFn: (s) => s.scheduledAt,
      header: "Horario",
      cell: (ctx) => {
        const s = ctx.row.original;
        return (
          <div className="whitespace-nowrap">
            <span className="font-mono text-sm text-slate-900">{formatTime(s.scheduledAt)}</span>
            {(showDate || !isToday(s.scheduledAt)) && (
              <span className="block text-xs text-slate-400">{formatDate(s.scheduledAt)}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "publicCode",
      header: "Código",
      cell: (ctx) => <CodeChip code={ctx.getValue() as string} />,
    },
    {
      id: "patient",
      accessorFn: (s) => `${s.patient.lastName}, ${s.patient.firstName} ${s.patient.documentId}`,
      header: "Paciente",
      cell: (ctx) => {
        const p = ctx.row.original.patient;
        return <span className="whitespace-nowrap text-slate-900">{p.lastName}, {p.firstName}</span>;
      },
    },
    {
      id: "procedure",
      accessorFn: (s) => `${s.procedure} ${s.surgeonName ?? ""}`,
      header: "Procedimiento",
      cell: (ctx) => (
        <div className="min-w-[180px]">
          <p className="text-slate-900">{ctx.row.original.procedure}</p>
          {ctx.row.original.surgeonName && <p className="text-xs text-slate-400">{ctx.row.original.surgeonName}</p>}
        </div>
      ),
    },
    {
      id: "room",
      accessorFn: (s) => s.operatingRoom?.code ?? "",
      header: "Quirófano",
      cell: (ctx) => <RoomChip code={ctx.row.original.operatingRoom?.code} />,
    },
    {
      id: "status",
      accessorFn: (s) => STATUS_LABEL[s.status],
      header: "Estado",
      cell: (ctx) => {
        const s = ctx.row.original;
        return (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={s.status} waitingRoom={s.waitingRoom} />
            {isDelayed(s) && (
              <span className="text-xs text-rose-600">Demora de {minutesBetween(s.scheduledAt)} min</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: (ctx) => (
        <Link
          to={`/surgeries/${ctx.row.original.id}`}
          className="inline-flex items-center rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-700"
          aria-label={`Ver la cirugía ${ctx.row.original.publicCode}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ),
    },
  ];
}
