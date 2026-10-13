// ======================================================
// Panel de checklist preoperatorio (components/ChecklistPanel.tsx)
// Lista simple de requisitos con su avance ("5 de 6 listos").
// El staff marca/desmarca cada ítem; quién y cuándo lo hizo
// queda en un texto gris secundario. En modo sólo lectura
// (portal del paciente) los ítems no son clickeables.
// El checklist se materializa en el backend desde la plantilla
// configurable la primera vez que se consulta.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { api, getErrorMessage } from "../lib/api-client";
import { formatDateTime } from "../lib/format";
import { cn } from "../lib/cn";
import { Card } from "./ui/card";
import { ErrorAlert } from "./ui/alert";
import { ProgressBar } from "./ui/kpi-card";
import { Skeleton } from "./ui/skeleton";
import type { ChecklistItem } from "../lib/types";

export default function ChecklistPanel({
  surgeryId,
  canEdit,
  /** Endpoint a usar: el staff usa /api/surgeries/..., el paciente /api/me/... */
  endpoint = `/api/surgeries/${surgeryId}/checklist`,
  /** Se llama cada vez que cambian los ítems (lo usa el detalle para habilitar el avance de estado). */
  onItemsChange,
  /** Título opcional (el portal del paciente lo usa como "Preparación"). */
  title = "Checklist preoperatorio",
}: {
  surgeryId: string;
  canEdit: boolean;
  endpoint?: string;
  onItemsChange?: (items: ChecklistItem[]) => void;
  title?: string;
}) {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (items) onItemsChange?.(items);
  }, [items, onItemsChange]);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<ChecklistItem[]>(endpoint));
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  /** Marca o desmarca un ítem y reemplaza la fila con la respuesta del backend. */
  async function toggle(item: ChecklistItem) {
    if (!canEdit || savingId) return;
    setErr(null);
    setSavingId(item.id);
    try {
      const updated = await api.patch<ChecklistItem>(`/api/checklist-items/${item.id}`, {
        checked: !item.checked,
      });
      setItems((prev) => prev?.map((i) => (i.id === updated.id ? updated : i)) ?? null);
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setSavingId(null);
    }
  }

  const done = items?.filter((i) => i.checked).length ?? 0;
  const total = items?.length ?? 0;

  return (
    <Card className="p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {items && total > 0 && (
          <span className="text-sm text-slate-500">
            {done} de {total} listos
          </span>
        )}
      </div>
      {items && total > 0 && <ProgressBar value={(done / total) * 100} tone={done === total ? "success" : "navy"} className="mt-4" />}

      <div className="mt-6">
        <ErrorAlert message={err} />
        {!items ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : total === 0 ? (
          <p className="text-sm text-slate-400">No hay ítems configurados en la plantilla.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void toggle(item)}
                  disabled={!canEdit || savingId === item.id}
                  aria-pressed={item.checked}
                  className={cn(
                    "flex w-full items-center gap-4 py-4 text-left",
                    canEdit ? "cursor-pointer" : "cursor-default",
                    savingId === item.id && "opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      item.checked ? "bg-navy-600 text-white" : "border border-slate-300",
                    )}
                  >
                    {item.checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className={cn("flex-1 text-sm", item.checked ? "text-slate-500" : "text-slate-900")}>{item.label}</span>
                  {/* Trazabilidad: quién y cuándo lo marcó, en segundo plano. */}
                  {item.checked && (
                    <span className="hidden text-xs text-slate-400 sm:block">
                      {item.checkedByUser?.fullName ?? "Verificado"}
                      {item.checkedAt && ` · ${formatDateTime(item.checkedAt)}`}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
