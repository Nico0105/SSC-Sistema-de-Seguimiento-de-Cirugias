// ======================================================
// DataTable (components/ui/data-table.tsx)
// Tabla genérica reutilizable sobre TanStack Table: buscador
// global, paginación client-side y un slot de "toolbar" para
// filtros específicos de cada página (ej. por estado).
// Estilo despejado: sin fondo en el encabezado, filas altas
// separadas por una línea hiperfina y encabezados en gris.
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
  /** Filtros adicionales específicos de la página (ej. pestañas de estado). */
  toolbar?: ReactNode;
  pageSize?: number;
  /** Título del panel, a la izquierda del buscador. */
  title?: ReactNode;
  /** Resalta una fila (ej. retrasos). */
  rowClassName?: (row: T) => string | undefined;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados",
  toolbar,
  pageSize = 10,
  title,
  rowClassName,
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
      <div className="flex flex-col gap-4 px-8 pt-7 pb-5 md:flex-row md:items-center">
        {title && <div className="min-w-0 md:mr-auto">{title}</div>}
        {toolbar}
        <div className={cn("relative w-full md:max-w-[260px]", !title && "md:mr-auto md:order-first")}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          <input
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full rounded-lg bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-8 pb-3 text-left text-xs font-medium text-slate-400">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={Math.min(pageSize, 6)} cols={columns.length} />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={columns.length}>{emptyMessage}</EmptyRow>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn("border-t border-slate-100/80 transition-colors hover:bg-slate-50/60", rowClassName?.(row.original))}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-8 py-5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && rows.length > 0 && pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100/80 px-8 py-4 text-sm text-slate-400">
          <span>{table.getFilteredRowModel().rows.length} resultados</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-lg p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-slate-600">
              {pageIndex + 1} de {pageCount}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-lg p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
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
