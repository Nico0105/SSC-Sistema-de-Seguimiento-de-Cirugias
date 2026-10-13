// ======================================================
// Portal del paciente (pages/MyCare.tsx)
// Única pantalla del rol "paciente" en la web: una sola
// columna, tranquila, en el orden en que el paciente la lee.
// Consume /api/me/* (el backend garantiza que sólo ve SU
// información):
//   1. Saludo y una frase con el estado de su cirugía.
//   2. Su cirugía: etapas con las horas reales.
//   3. Su preparación (checklist, sólo lectura).
//   4. "¿Cómo te sentís hoy?" (registro diario de síntomas).
//   5. Indicaciones y mensajes de su equipo médico.
//   Plegado (divulgación progresiva): reportes anteriores y
//   otras cirugías.
// ======================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { api, getErrorMessage } from "../lib/api-client";
import { toast } from "../lib/toast";
import { SYMPTOM_LABEL, SYMPTOM_OPTIONS, POSTOP_STATUS_LABEL } from "../lib/symptoms";
import { ACTIVE_STATUSES, FLOW_STEPS, STATUS_LABEL, type SurgeryStatus } from "../lib/surgery-status";
import { formatCode, formatDate, formatDateTime, formatLongDate, formatTime } from "../lib/format";
import { cn } from "../lib/cn";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ErrorAlert } from "../components/ui/alert";
import { Loading } from "../components/ui/spinner";
import { StatusBadge } from "../components/ui/status-badge";
import ChecklistPanel from "../components/ChecklistPanel";
import MessagesPanel from "../components/MessagesPanel";
import type { Patient, PostopRecord, Surgery, SurgeryHistoryEntry, SymptomReport } from "../lib/types";

type OwnSurgery = Omit<Surgery, "patient"> & { history: SurgeryHistoryEntry[] };

const EMPTY_FORM = { symptoms: [] as string[], painLevel: 0, notes: "" };

/** Frase bajo el saludo según el estado de la cirugía activa. */
const STATUS_SENTENCE: Record<SurgeryStatus, string> = {
  programada: "Tu cirugía está programada. Revisá tu preparación.",
  en_quirofano: "Tu cirugía está en curso. El equipo médico te acompaña.",
  esperando_en_sala: "La intervención terminó. Estás en recuperación.",
  postoperatorio: "Estás en la etapa postoperatoria. Contanos cada día cómo te sentís.",
  alta: "Recibiste el alta. Seguí registrando tus síntomas.",
  cancelada: "Tu cirugía fue cancelada. Comunicate con el hospital.",
};

export default function MyCare() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [surgeries, setSurgeries] = useState<OwnSurgery[]>([]);
  const [postop, setPostop] = useState<PostopRecord[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const [p, s, po, sy] = await Promise.all([
        api.get<Patient>("/api/me/patient"),
        api.get<OwnSurgery[]>("/api/me/surgeries"),
        api.get<PostopRecord[]>("/api/me/postop"),
        api.get<SymptomReport[]>("/api/me/symptoms"),
      ]);
      setPatient(p);
      setSurgeries(s);
      setPostop(po);
      setSymptoms(sy);
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Cirugía "activa": la próxima que sigue en el circuito; si no hay, la más reciente.
  const active = useMemo(() => {
    const inCircuit = surgeries
      .filter((s) => ACTIVE_STATUSES.includes(s.status))
      .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
    return inCircuit[0] ?? surgeries[0] ?? null;
  }, [surgeries]);
  const others = surgeries.filter((s) => s.id !== active?.id);

  function toggleSymptom(value: string) {
    setForm((f) => ({
      ...f,
      symptoms: f.symptoms.includes(value) ? f.symptoms.filter((s) => s !== value) : [...f.symptoms, value],
    }));
  }

  /** Envía el reporte diario de síntomas. */
  async function submitSymptoms(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setSaving(true);
    try {
      await api.post("/api/me/symptoms", {
        symptoms: form.symptoms,
        painLevel: form.painLevel,
        notes: form.notes || null,
      });
      setForm(EMPTY_FORM);
      toast.success("Registrado. ¡Gracias!");
      setSymptoms(await api.get<SymptomReport[]>("/api/me/symptoms"));
    } catch (error) {
      setFormErr(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading label="Cargando tu información…" />;
  if (err) return <ErrorAlert message={err} />;

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      {/* 1 · Saludo */}
      <header>
        <p className="text-sm text-slate-400">{formatLongDate(new Date())}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Hola, {patient?.firstName}</h1>
        {active && <p className="mt-3 text-lg text-slate-500">{STATUS_SENTENCE[active.status]}</p>}
      </header>

      {/* 2 · Tu cirugía */}
      {active ? (
        <ActiveSurgeryCard surgery={active} />
      ) : (
        <Card className="p-8 text-sm text-slate-400">No tenés cirugías registradas.</Card>
      )}

      {/* 3 · Preparación */}
      {active && active.status === "programada" && (
        <ChecklistPanel
          surgeryId={active.id}
          canEdit={false}
          endpoint={`/api/me/surgeries/${active.id}/checklist`}
          title="Tu preparación"
        />
      )}

      {/* 4 · Síntomas */}
      <Card className="p-8">
        <h2 className="text-base font-semibold text-slate-900">¿Cómo te sentís hoy?</h2>
        <form onSubmit={submitSymptoms} className="mt-6 space-y-8">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Síntomas">
            {SYMPTOM_OPTIONS.map((s) => {
              const on = form.symptoms.includes(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleSymptom(s.value)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition-colors",
                    on ? "bg-navy-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200/70",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Dolor: <span className="font-medium text-slate-900">{form.painLevel} de 10</span>
            </p>
            <input
              type="range"
              min={0}
              max={10}
              value={form.painLevel}
              onChange={(e) => setForm({ ...form, painLevel: Number(e.target.value) })}
              aria-label="Nivel de dolor de 0 a 10"
              className="mt-3 w-full accent-navy-600"
            />
          </div>

          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            aria-label="Observaciones"
            placeholder="¿Algo más que quieras contarnos? (opcional)"
            className="w-full resize-y rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
          />

          <ErrorAlert message={formErr} />
          <Button type="submit" busy={saving} disabled={form.symptoms.length === 0}>Registrar</Button>
        </form>
      </Card>

      {/* 5 · Indicaciones del equipo médico */}
      {postop.length > 0 && (
        <Card className="p-8">
          <h2 className="text-base font-semibold text-slate-900">Indicaciones de tu equipo</h2>
          <ol className="mt-6 divide-y divide-slate-100">
            {postop.map((r) => (
              <li key={r.id} className="py-5 first:pt-0 last:pb-0">
                <p className="text-xs text-slate-400">
                  {formatDateTime(r.createdAt)} · {POSTOP_STATUS_LABEL[r.status] ?? r.status}
                </p>
                {r.medication && <p className="mt-2 text-sm text-slate-900">{r.medication}</p>}
                {r.evolution && <p className="mt-1 text-sm text-slate-500">{r.evolution}</p>}
                {r.observations && <p className="mt-1 text-sm text-slate-500">{r.observations}</p>}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <MessagesPanel endpoint="/api/me/messages" canWrite={false} />

      {/* Plegado: historial */}
      <div className="space-y-4 text-sm text-slate-500">
        {symptoms.length > 0 && (
          <Collapsible title={`Tus reportes anteriores (${symptoms.length})`}>
            <ol className="divide-y divide-slate-100">
              {symptoms.slice(0, 15).map((r) => (
                <li key={r.id} className="flex justify-between gap-4 py-3">
                  <span className="text-slate-700">{r.symptoms.map((sym) => SYMPTOM_LABEL[sym] ?? sym).join(", ")}</span>
                  <span className="shrink-0 text-slate-400">
                    Dolor {r.painLevel} · {formatDate(r.reportedAt)}
                  </span>
                </li>
              ))}
            </ol>
          </Collapsible>
        )}
        {others.length > 0 && (
          <Collapsible title={`Otras cirugías (${others.length})`}>
            <ol className="divide-y divide-slate-100">
              {others.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-slate-700">{s.procedure}</span>
                  <span className="shrink-0 text-slate-400">{formatDate(s.scheduledAt)}</span>
                </li>
              ))}
            </ol>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

/** Cirugía activa: qué, cuándo, dónde y sus etapas. */
function ActiveSurgeryCard({ surgery }: { surgery: OwnSurgery }) {
  /** Hora real en que se llegó a cada paso (entrada más antigua del historial). */
  const reachedAt = (step: SurgeryStatus) => {
    const entries = surgery.history.filter((h) => h.status === step);
    return entries.length ? entries[entries.length - 1]!.createdAt : null;
  };
  const currentIndex = FLOW_STEPS.indexOf(surgery.status);
  const location =
    surgery.status === "esperando_en_sala" && surgery.waitingRoom ? `Sala ${surgery.waitingRoom}` : surgery.operatingRoom?.name;

  return (
    <Card className="p-8">
      <StatusBadge status={surgery.status} waitingRoom={surgery.waitingRoom} />
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{surgery.procedure}</h2>
      <p className="mt-2 text-sm text-slate-500">
        {formatDate(surgery.scheduledAt)} a las {formatTime(surgery.scheduledAt)}
        {surgery.surgeonName && ` · ${surgery.surgeonName}`}
        {location && ` · ${location}`}
      </p>

      {surgery.status !== "cancelada" && (
        <ol className="mt-8 space-y-4">
          {FLOW_STEPS.map((step, i) => {
            const reached = i <= currentIndex;
            const current = i === currentIndex;
            const time = reachedAt(step);
            return (
              <li key={step} className="flex items-center gap-4">
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    current ? "bg-navy-600 ring-4 ring-navy-100" : reached ? "bg-navy-600" : "bg-slate-200",
                  )}
                />
                <span className={cn("flex-1 text-sm", current ? "font-medium text-slate-900" : reached ? "text-slate-600" : "text-slate-300")}>
                  {STATUS_LABEL[step]}
                </span>
                <span className="font-mono text-xs text-slate-400">{reached && time ? formatTime(time) : ""}</span>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-8 text-sm text-slate-400">
        Tus familiares pueden seguir tu avance en la sala de espera con el código{" "}
        <span className="font-mono text-slate-700">{formatCode(surgery.publicCode)}</span>. Sólo se muestra tu nombre y la inicial de tu apellido.
      </p>
    </Card>
  );
}

/** Sección plegable para información secundaria. */
function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 hover:text-slate-800">
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        {title}
      </summary>
      <div className="mt-3 rounded-2xl bg-white px-6 py-2">{children}</div>
    </details>
  );
}
