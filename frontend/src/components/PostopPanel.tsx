// ======================================================
// Panel de seguimiento postoperatorio (components/PostopPanel.tsx)
// Historial cronológico de controles de una cirugía como una
// lista simple (estado, fecha, evolución y medicación) y un
// formulario de carga que sólo aparece al pedirlo.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, getErrorMessage } from "../lib/api-client";
import { toast } from "../lib/toast";
import { POSTOP_STATUS_LABEL, POSTOP_STATUS_OPTIONS } from "../lib/symptoms";
import { formatDateTime } from "../lib/format";
import { cn } from "../lib/cn";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { ErrorAlert } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import type { PostopRecord } from "../lib/types";

const EMPTY_FORM = {
  status: "estable",
  evolution: "",
  medication: "",
  compliance: true,
  observations: "",
};

/** Punto de color (pastel) de cada estado del control. */
const POSTOP_DOT: Record<string, string> = {
  estable: "bg-blue-400",
  mejorando: "bg-emerald-400",
  con_complicaciones: "bg-rose-400",
  alta: "bg-emerald-500",
};

export default function PostopPanel({
  surgeryId,
  canCreate,
}: {
  surgeryId: string;
  canCreate: boolean;
}) {
  const [records, setRecords] = useState<PostopRecord[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRecords(await api.get<PostopRecord[]>(`/api/surgeries/${surgeryId}/postop`));
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }, [surgeryId]);

  useEffect(() => { void load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api.post(`/api/surgeries/${surgeryId}/postop`, {
        ...form,
        evolution: form.evolution || null,
        medication: form.medication || null,
        observations: form.observations || null,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Control registrado");
      await load();
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-900">Controles postoperatorios</h2>
        {canCreate && !showForm && (
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Nuevo control
          </Button>
        )}
      </div>

      <div className="mt-6">
        <ErrorAlert message={err} />

        {showForm && canCreate && (
          <form onSubmit={submit} className="mb-8 grid grid-cols-1 gap-5 rounded-2xl bg-slate-50 p-6 md:grid-cols-2">
            <Select label="Estado del paciente" value={form.status} onChange={(v) => setForm({ ...form, status: v })} required>
              {POSTOP_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
            <Input label="Medicación indicada" value={form.medication} onChange={(v) => setForm({ ...form, medication: v })} />
            <Input label="Evolución" value={form.evolution} onChange={(v) => setForm({ ...form, evolution: v })} />
            <Input label="Observaciones" value={form.observations} onChange={(v) => setForm({ ...form, observations: v })} />
            <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
              <input
                type="checkbox"
                checked={form.compliance}
                onChange={(e) => setForm({ ...form, compliance: e.target.checked })}
                className="h-4 w-4 accent-navy-600"
              />
              Cumple las indicaciones
            </label>
            <div className="flex justify-end gap-3 md:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" busy={saving}>Guardar control</Button>
            </div>
          </form>
        )}

        {!records ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-400">Sin controles registrados.</p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {records.map((r) => (
              <li key={r.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                    <span className={cn("h-1.5 w-1.5 rounded-full", POSTOP_DOT[r.status] ?? "bg-slate-300")} />
                    {POSTOP_STATUS_LABEL[r.status] ?? r.status}
                    {!r.compliance && <span className="font-normal text-amber-700">· no cumple indicaciones</span>}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(r.createdAt)}
                    {r.createdByUser && ` · ${r.createdByUser.fullName}`}
                  </span>
                </div>
                {r.evolution && <p className="mt-2 text-sm text-slate-600">{r.evolution}</p>}
                {r.medication && <p className="mt-1 text-sm text-slate-500">Medicación: {r.medication}</p>}
                {r.observations && <p className="mt-1 text-sm text-slate-400">{r.observations}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
