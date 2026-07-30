// ======================================================
// DataTable (components/ui/data-table.tsx)
// Tabla genérica reutilizable sobre TanStack Table: buscador
// global, paginación client-side y un slot de "toolbar" para
// filtros específicos de cada página (ej. por estado). Antes
// cada página con tabla (Dashboard, Patients, Surgeries,
// Appointments, Users, EmailLogs) reimplementaba su propio
// <table> sin buscador ni paginación — esto reemplaza esa
// duplicación con una sola implementación.
//
// El paginado es client-side a propósito: el volumen de datos
// de una clínica (cientos de cirugías/pacientes, no millones)
// no justifica paginar en el servidor; si el dataset creciera
// mucho, este componente es el único lugar a cambiar.
// ======================================================
import { type ReactNode } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "../../lib/cn";
import { TableSkeleton } from "./skeleton";
import { EmptyRow } from "./table";

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  isLoading?: boolean;
  /** Texto del buscador global (filtra por todas las columnas de texto). */
  searchPlaceholder?: string;
  /** Mensaje cuando no hay filas (ni con filtros, ni sin ellos). */
  emptyMessage?: string;
  /** Filtros adicionales específicos de la página (ej. <Select> de estado). */
  toolbar?: ReactNode;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados",
  toolbar,
  pageSize = 10,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        {toolbar}
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id} className="text-left px-6 py-3 font-medium">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeleton rows={pageSize} cols={columns.length} />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={columns.length}>{emptyMessage}</EmptyRow>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {!isLoading && rows.length > 0 && pageCount > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Página {pageIndex + 1} de {pageCount} · {table.getFilteredRowModel().rows.length} resultado(s)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={cn(
                "p-1.5 rounded-md border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed",
                "hover:bg-slate-50",
              )}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-md border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
