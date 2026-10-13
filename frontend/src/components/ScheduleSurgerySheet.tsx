// ======================================================
// Programar cirugía (components/ScheduleSurgerySheet.tsx)
// Panel lateral para dar de alta una cirugía en cuatro pasos
// leídos de arriba hacia abajo: paciente, procedimiento,
// quirófano (con su disponibilidad actual) y fecha/hora.
// El código de seguimiento lo asigna el backend.
// Toda cirugía nace "programada"; el backend envía la
// confirmación por email y la publica en la pantalla pública.
// ======================================================
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "../lib/api-client";
import { toast } from "../lib/toast";
import { buildRoomSnapshots, ROOM_STATE_INFO } from "../lib/room-status";
import { formatCode } from "../lib/format";
import { cn } from "../lib/cn";
import { SURGERIES_QUERY_KEY } from "../hooks/use-surgeries-query";
import { Sheet, SheetContent } from "./ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { DateTimeField } from "./ui/datetime-field";
import { Select } from "./ui/select";
import { ErrorAlert } from "./ui/alert";
import type { OperatingRoom, Patient, Surgery } from "../lib/types";

const EMPTY_FORM = {
  patientId: "",
  operatingRoomId: "",
  procedure: "",
  surgeonName: "",
  scheduledAt: "",
};

const FORM_ID = "schedule-surgery-form";

/**
 * Prefijo del código ("Cataratas" → "CAT"), espejo de codePrefix() en
 * backend/src/lib/surgery-code.ts. Vacío mientras no haya letras escritas.
 */
function codePrefix(procedure: string): string {
  const letters = procedure
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return letters ? letters.slice(0, 3).padEnd(3, "X") : "";
}

export function ScheduleSurgerySheet({
  open,
  onOpenChange,
  patients,
  rooms,
  surgeries,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
  rooms: OperatingRoom[];
  surgeries: Surgery[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Al abrir, se limpia el formulario anterior.
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErr(null);
    }
  }, [open]);

  const snapshots = useMemo(() => buildRoomSnapshots(rooms, surgeries), [rooms, surgeries]);
  const patient = patients.find((p) => p.id === form.patientId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const created = await api.post<Surgery>("/api/surgeries", {
        ...form,
        surgeonName: form.surgeonName || null,
        operatingRoomId: form.operatingRoomId || null,
        // DateTimeField devuelve hora local; se envía en ISO/UTC.
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      await queryClient.invalidateQueries({ queryKey: SURGERIES_QUERY_KEY });
      toast.success(`Cirugía ${formatCode(created.publicCode)} programada`);
      onOpenChange(false);
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Programar cirugía"
        description="El código se arma con el procedimiento y se numera solo (ej. CAT-01)."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} busy={saving}>
              Programar
            </Button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={submit} className="space-y-8">
          <div>
            <Select label="Paciente" value={form.patientId} onChange={(v) => setForm({ ...form, patientId: v })} required>
              <option value="">Seleccionar paciente…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.lastName}, {p.firstName} · DNI {p.documentId}
                </option>
              ))}
            </Select>
            {/* Sólo lo crítico del paciente: alergias. */}
            {patient?.allergies && (
              <p className="mt-2 text-sm text-rose-600">Alergia registrada: {patient.allergies}</p>
            )}
          </div>

          <div>
            <Input
              label="Procedimiento"
              value={form.procedure}
              onChange={(v) => setForm({ ...form, procedure: v })}
              required
              placeholder="Ej. Cataratas"
            />
            {/* Vista previa del código; el número definitivo lo asigna el backend. */}
            {codePrefix(form.procedure) && (
              <p className="mt-2 text-sm text-slate-400">
                Código: <span className="font-mono text-slate-600">{codePrefix(form.procedure)}-··</span>
              </p>
            )}
          </div>

          {/* Quirófanos con su disponibilidad actual */}
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-slate-700">Quirófano</legend>
            {snapshots.length === 0 ? (
              <p className="text-sm text-slate-400">No hay quirófanos activos.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Quirófano">
                {snapshots.map(({ room, state }) => {
                  const selected = form.operatingRoomId === room.id;
                  const info = ROOM_STATE_INFO[state];
                  return (
                    <button
                      key={room.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setForm({ ...form, operatingRoomId: selected ? "" : room.id })}
                      className={cn(
                        "rounded-xl px-3.5 py-3 text-left transition-colors",
                        selected ? "bg-navy-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      <span className="block font-mono text-sm font-medium">{room.code}</span>
                      <span className={cn("mt-1 flex items-center gap-1.5 text-xs", selected ? "text-white/80" : "text-slate-500")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", selected ? "bg-white" : info.dot)} />
                        {info.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-400">Opcional: se puede asignar después.</p>
          </fieldset>

          <DateTimeField
            label="Fecha y hora"
            value={form.scheduledAt}
            onChange={(v) => setForm({ ...form, scheduledAt: v })}
            required
          />

          <Input
            label="Cirujano principal"
            value={form.surgeonName}
            onChange={(v) => setForm({ ...form, surgeonName: v })}
            placeholder="Opcional"
          />

          <ErrorAlert message={err} />
        </form>
      </SheetContent>
    </Sheet>
  );
}
