// ======================================================
// Panel de checklist preoperatorio (components/ChecklistPanel.tsx)
// Muestra el checklist de una cirugía y permite marcar /
// desmarcar ítems al staff. En modo sólo lectura (portal del
// paciente) se ocultan los controles de edición.
// El checklist se materializa en el backend desde la plantilla
// configurable la primera vez que se consulta.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../lib/api-client";
import { ErrorAlert, Loading } from "./ui";
import type { ChecklistItem } from "../lib/types";

export default function ChecklistPanel({
  surgeryId,
  canEdit,
  /** Endpoint a usar: el staff usa /api/surgeries/..., el paciente /api/me/... */
  endpoint = `/api/surgeries/${surgeryId}/checklist`,
}: {
  surgeryId: string;
  canEdit: boolean;
  endpoint?: string;
}) {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<ChecklistItem[]>(endpoint));
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  /** Marca o desmarca un ítem con actualización optimista simple. */
  async function toggle(item: ChecklistItem) {
    if (!canEdit) return;
    setErr(null);
    try {
      const updated = await api.patch<ChecklistItem>(`/api/checklist-items/${item.id}`, {
        checked: !item.checked,
      });
      setItems((prev) => prev?.map((i) => (i.id === updated.id ? updated : i)) ?? null);
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }

  if (!items) return <Loading label="Cargando checklist…" />;

  const done = items.filter((i) => i.checked).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800">Checklist preoperatorio</h2>
        <span className="text-xs text-slate-500">{done}/{items.length} completados</span>
      </div>

      <ErrorAlert message={err} />

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No hay ítems configurados en la plantilla.</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {items.map((item) => (
            <li key={item.id}>
              <label className={`flex items-start gap-3 ${canEdit ? "cursor-pointer" : ""}`}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  disabled={!canEdit}
                  onChange={() => void toggle(item)}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-sm">
                  <span className={item.checked ? "text-slate-500 line-through" : "text-slate-800"}>
                    {item.label}
                  </span>
                  {/* Trazabilidad: quién y cuándo lo marcó. */}
                  {item.checked && item.checkedByUser && (
                    <span className="block text-xs text-slate-400">
                      {item.checkedByUser.fullName}
                      {item.checkedAt && ` · ${new Date(item.checkedAt).toLocaleString()}`}
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
