// ======================================================
// Detalle de una cirugía (pages/SurgeryDetail.tsx)
// Organizado por divulgación progresiva:
//   - Arriba, siempre visible: qué cirugía es, en qué estado
//     está y UNA acción principal para avanzarla (sólo para
//     roles autorizados y sólo hacia transiciones válidas; el
//     backend vuelve a validar). Avanzar exige checklist completo.
//   - Línea de etapas con las horas reales.
//   - En pestañas: checklist, seguimiento postoperatorio,
//     historial de cambios y detalles (equipo, notas, etc.).
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api, getErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { can } from "../lib/permissions";
import { toast } from "../lib/toast";
import { ALLOWED_TRANSITIONS, STATUS_LABEL, type SurgeryStatus } from "../lib/surgery-status";
import { ageFrom, formatCode, formatDate, formatDateTime, formatDuration, formatTime, minutesBetween } from "../lib/format";
import { useRealtime } from "../hooks/use-realtime";
import { useClock } from "../hooks/use-clock";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ErrorAlert } from "../components/ui/alert";
import { Loading } from "../components/ui/spinner";
import { StatusBadge } from "../components/ui/status-badge";
import { Breadcrumbs } from "../components/ui/page-header";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { SurgeryStepper } from "../components/SurgeryStepper";
import ChecklistPanel from "../components/ChecklistPanel";
import PostopPanel from "../components/PostopPanel";
import type { ChecklistItem, SurgeryDetail as SurgeryDetailData } from "../lib/types";

export default function SurgeryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canChangeStatus = can(user?.roles, "cirugias:cambiar_estado");
  const canSeeClinical = can(user?.roles, "clinica:ver");

  const [surgery, setSurgery] = useState<SurgeryDetailData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  /** Número de sala a informar al pasar a "esperando_en_sala". */
  const [room, setRoom] = useState("");
  /**
   * Ítems del checklist sin marcar. null = todavía no se cargó (o el usuario
   * no ve el checklist): no se bloquea en la UI y decide el backend.
   */
  const [pendingChecks, setPendingChecks] = useState<string[] | null>(null);
  const onChecklistChange = useCallback((items: ChecklistItem[]) => {
    setPendingChecks(items.filter((i) => !i.checked).map((i) => i.label));
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setSurgery(await api.get<SurgeryDetailData>(`/api/surgeries/${id}`));
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  // Si otro usuario cambia el estado, esta vista se actualiza sola.
  useRealtime(["surgery:update"], load);

  /** Avanza la cirugía al estado indicado (validado también por el backend). */
  async function changeStatus(status: SurgeryStatus) {
    const needsRoom = status === "esperando_en_sala";
    if (needsRoom && !room.trim()) {
      setErr("Indicá el número de sala donde espera el paciente");
      return;
    }
    setErr(null);
    setChanging(true);
    try {
      await api.patch(`/api/surgeries/${id}/status`, {
        status,
        waitingRoom: needsRoom ? room.trim() : undefined,
      });
      setRoom("");
      toast.success(`Estado actualizado: ${STATUS_LABEL[status]}`);
      await load();
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setChanging(false);
    }
  }

  if (!surgery) {
    return err ? <ErrorAlert message={err} /> : <Loading label="Cargando cirugía…" />;
  }

  // Paso siguiente del flujo (la acción principal) y cancelación (secundaria).
  const transitions = ALLOWED_TRANSITIONS[surgery.status];
  const nextStep = transitions.find((s) => s !== "cancelada");
  const canCancel = transitions.includes("cancelada");
  // Avanzar exige el checklist completo; cancelar no (mismo criterio que el backend).
  const checklistBlocks = (pendingChecks?.length ?? 0) > 0;
  const patient = surgery.patient;
  const age = ageFrom(patient.birthDate);

  return (
    <>
      <Breadcrumbs items={[{ label: "Cirugías", to: "/surgeries" }, { label: formatCode(surgery.publicCode) }]} />

      {/* Qué cirugía es y en qué estado está */}
      <header className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <StatusBadge status={surgery.status} waitingRoom={surgery.waitingRoom} size="lg" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{surgery.procedure}</h1>
          <p className="mt-2 text-base text-slate-500">
            {patient.firstName} {patient.lastName}
            {age !== null && `, ${age} años`}
            <span className="mx-2 text-slate-300">·</span>
            {surgery.operatingRoom ? surgery.operatingRoom.name : "Sin quirófano"}
            <span className="mx-2 text-slate-300">·</span>
            <TimeSummary surgery={surgery} />
          </p>
          {patient.allergies && <p className="mt-2 text-sm text-rose-600">Alergia: {patient.allergies}</p>}
        </div>

        {/* Acción principal: avanzar al siguiente paso */}
        {canChangeStatus && nextStep && (
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex items-center gap-3">
              {nextStep === "esperando_en_sala" && (
                <input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  maxLength={20}
                  placeholder="N° de sala"
                  aria-label="Número de sala de espera"
                  className="h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/15"
                />
              )}
              <Button busy={changing} disabled={checklistBlocks} onClick={() => void changeStatus(nextStep)}>
                Pasar a {STATUS_LABEL[nextStep].toLowerCase()} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            {checklistBlocks && (
              <p className="text-sm text-amber-700">Falta completar el checklist ({pendingChecks!.length} pendientes).</p>
            )}
            {canCancel && (
              <button onClick={() => setConfirmCancel(true)} disabled={changing} className="text-sm text-slate-400 hover:text-rose-600">
                Cancelar cirugía
              </button>
            )}
          </div>
        )}
      </header>

      {err && <div className="mb-8"><ErrorAlert message={err} /></div>}

      <Card className="mb-12 p-8">
        <SurgeryStepper status={surgery.status} history={surgery.history} scheduledAt={surgery.scheduledAt} />
      </Card>

      {/* Lo secundario, en pestañas */}
      <Tabs defaultValue={canSeeClinical ? "checklist" : "historial"}>
        <TabsList variant="underline">
          {canSeeClinical && <TabsTrigger value="checklist">Checklist</TabsTrigger>}
          {canSeeClinical && <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>}
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
        </TabsList>

        {/* Checklist y seguimiento: información clínica, oculta para la recepción. */}
        {canSeeClinical && (
          <>
            {/* forceMount: el checklist debe cargarse aunque no esté visible, porque habilita el avance de estado. */}
            <TabsContent value="checklist" forceMount className="data-[state=inactive]:hidden">
              <ChecklistPanel
                surgeryId={surgery.id}
                canEdit={can(user?.roles, "clinica:escribir")}
                onItemsChange={onChecklistChange}
              />
            </TabsContent>
            <TabsContent value="seguimiento">
              <PostopPanel surgeryId={surgery.id} canCreate={can(user?.roles, "postop:escribir")} />
            </TabsContent>
          </>
        )}

        <TabsContent value="historial">
          <Card className="p-8">
            {surgery.history.length === 0 ? (
              <p className="text-sm text-slate-400">Sin cambios registrados.</p>
            ) : (
              <ol className="space-y-5">
                {surgery.history.map((h) => (
                  <li key={h.id} className="flex items-baseline gap-6">
                    <span className="w-28 shrink-0 font-mono text-sm text-slate-400">{formatDateTime(h.createdAt)}</span>
                    <span className="text-sm text-slate-800">
                      {STATUS_LABEL[h.status]}
                      {h.note && <span className="text-slate-400"> — {h.note}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="detalles">
          <Card className="p-8">
            <dl className="grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
              <Detail label="Código de seguimiento" value={formatCode(surgery.publicCode)} mono />
              <Detail label="Cirujano principal" value={surgery.surgeonName ?? "Sin asignar"} />
              <Detail label="Quirófano" value={surgery.operatingRoom ? `${surgery.operatingRoom.code} · ${surgery.operatingRoom.name}` : "Sin asignar"} />
              <Detail label="Programada" value={formatDateTime(surgery.scheduledAt)} />
              <Detail label="Paciente" value={`${patient.lastName}, ${patient.firstName} · DNI ${patient.documentId}`} />
              {surgery.waitingRoom && <Detail label="Sala de espera" value={`Sala ${surgery.waitingRoom}`} />}
              {surgery.notes && <Detail label="Notas" value={surgery.notes} />}
            </dl>
            <p className="mt-8 text-sm text-slate-500">
              La pantalla de sala de espera muestra el código, el nombre abreviado (ej. "Mateo R."), los horarios y el estado.
              {canSeeClinical && (
                <>
                  {" "}
                  <Link to={`/patients/${patient.id}/history`} className="text-blue-700 hover:underline">
                    Ver historia clínica
                  </Link>
                </>
              )}
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="¿Cancelar esta cirugía?"
        description="La cancelación es definitiva: la cirugía ya no podrá avanzar de estado."
        confirmLabel="Cancelar cirugía"
        variant="destructive"
        busy={changing}
        onConfirm={() => void changeStatus("cancelada").then(() => setConfirmCancel(false))}
      />
    </>
  );
}

/** "En curso hace 45 min" / "Duró 1 h 15 min" / "Programada 08:30". */
function TimeSummary({ surgery }: { surgery: SurgeryDetailData }) {
  const now = useClock(30_000);
  if (surgery.status === "en_quirofano" && surgery.startedAt) {
    return <>En curso hace {formatDuration(minutesBetween(surgery.startedAt, now))}</>;
  }
  if (surgery.startedAt && surgery.endedAt) {
    return <>Duró {formatDuration(minutesBetween(surgery.startedAt, surgery.endedAt))}</>;
  }
  return <>Programada el {formatDate(surgery.scheduledAt)} a las {formatTime(surgery.scheduledAt)}</>;
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd className={mono ? "mt-1 font-mono text-slate-900" : "mt-1 text-slate-900"}>{value}</dd>
    </div>
  );
}
