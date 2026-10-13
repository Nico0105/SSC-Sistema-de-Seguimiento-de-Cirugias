// ======================================================
// Agenda y Calendario Semanal (pages/Appointments.tsx)
// Planificación de la semana con turnos (consultas,
// prequirúrgicas, controles, estudios) y cirugías en una
// misma grilla día × hora:
//   - Navegación por semana, vista calendario o lista.
//   - Línea roja con la hora actual en la columna de hoy.
//   - Panel de detalle del evento elegido; en los turnos,
//     los roles autorizados pueden confirmarlo, completarlo
//     o cancelarlo (PATCH /api/appointments/:id).
//   - Alta de turnos en panel lateral (el backend envía la
//     confirmación por email al paciente).
// ======================================================
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { api, getErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { can } from "../lib/permissions";
import { toast } from "../lib/toast";
import {
  addDays,
  APPOINTMENT_STATUS_INFO,
  APPOINTMENT_TYPE_INFO,
  APPOINTMENT_TYPES,
  buildWeekEvents,
  FIRST_HOUR,
  hourRow,
  isoWeek,
  LAST_HOUR,
  sameDay,
  startOfWeek,
  type AgendaEvent,
} from "../lib/calendar";
import { formatCode, formatDate, formatDateTime, formatTime } from "../lib/format";
import { cn } from "../lib/cn";
import { useSurgeriesQuery } from "../hooks/use-surgeries-query";
import { APPOINTMENTS_QUERY_KEY, useAppointmentsQuery, usePatientsQuery } from "../hooks/use-catalog-queries";
import { useClock } from "../hooks/use-clock";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DataTable } from "../components/ui/data-table";
import { ErrorAlert } from "../components/ui/alert";
import { FilterPills } from "../components/ui/filter-pills";
import { PageHeader } from "../components/ui/page-header";
import { Sheet, SheetContent } from "../components/ui/sheet";
import { Input } from "../components/ui/input";
import { DateTimeField } from "../components/ui/datetime-field";
import { Select } from "../components/ui/select";
import { StatusBadge } from "../components/ui/status-badge";
import { Skeleton } from "../components/ui/skeleton";

const EMPTY_FORM = { patientId: "", scheduledAt: "", type: "consulta", notes: "" };
const FORM_ID = "new-appointment-form";
/** Alto de cada fila horaria de la grilla (px); se usa también para ubicar la línea de "ahora". */
const ROW_HEIGHT = 96;
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
/** Tono de las cirugías en la grilla (los turnos usan el de su tipo). */
const SURGERY_TONE = "bg-navy-50 text-navy-700";

export default function Appointments() {
  const { user } = useAuth();
  const canEdit = can(user?.roles, "turnos:escribir");
  const queryClient = useQueryClient();
  const now = useClock(60_000);

  const { data: appointments = [], isLoading, error } = useAppointmentsQuery();
  const { data: surgeries = [], isLoading: surgeriesLoading } = useSurgeriesQuery();
  const { data: patients = [] } = usePatientsQuery();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [view, setView] = useState<"semana" | "lista">("semana");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const events = useMemo(() => buildWeekEvents(weekStart, appointments, surgeries), [weekStart, appointments, surgeries]);
  const selected = events.find((e) => e.id === selectedId) ?? null;

  // Al cambiar de semana se preselecciona el próximo evento (o el primero).
  useEffect(() => {
    if (selectedId && events.some((e) => e.id === selectedId)) return;
    const upcoming = events.find((e) => e.at >= new Date()) ?? events[0];
    setSelectedId(upcoming?.id ?? null);
  }, [events, selectedId]);

  const weekLabel = `${formatDate(days[0]!)} – ${formatDate(days[6]!)}`;
  const isCurrentWeek = sameDay(weekStart, startOfWeek(new Date()));


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setSaving(true);
    try {
      await api.post("/api/appointments", {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        notes: form.notes || null,
      });
      await queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
      toast.success("Turno registrado. Se envió la confirmación al paciente.");
      setWeekStart(startOfWeek(new Date(form.scheduledAt)));
      setForm(EMPTY_FORM);
      setSheetOpen(false);
    } catch (error) {
      setFormErr(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  /** Cambia el estado de un turno (confirmar / completar / cancelar). */
  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    try {
      await api.patch(`/api/appointments/${id}`, { status });
      await queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
      toast.success(`Turno ${APPOINTMENT_STATUS_INFO[status]?.label.toLowerCase() ?? status}`);
    } catch (error) {
      toast.error(error);
    } finally {
      setUpdating(false);
    }
  }

  const loading = isLoading || surgeriesLoading;

  return (
    <>
      <PageHeader
        title="Agenda"
        description={`Semana ${isoWeek(weekStart)} · ${weekLabel}`}
        actions={
          canEdit && (
            <Button onClick={() => { setFormErr(null); setSheetOpen(true); }}>
              <Plus className="h-4 w-4" /> Nuevo turno
            </Button>
          )
        }
      />

      {error && <div className="mb-8"><ErrorAlert message={getErrorMessage(error)} /></div>}

      {/* Navegación de semana y vista */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Semana anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Semana siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isCurrentWeek && (
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Hoy
          </Button>
        )}
        <FilterPills
          className="ml-auto"
          ariaLabel="Vista"
          value={view}
          onChange={setView}
          options={[
            { value: "semana", label: "Semana" },
            { value: "lista", label: "Lista" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]">
        {view === "semana" ? (
          <Card className="overflow-hidden">
            {loading ? (
              <Skeleton className="m-8 h-[480px]" />
            ) : (
              <WeekGrid days={days} events={events} now={now} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </Card>
        ) : (
          <Card>
            <DataTable
              columns={listColumns(setSelectedId)}
              data={events}
              isLoading={loading}
              searchPlaceholder="Buscar"
              emptyMessage="Sin turnos ni cirugías en esta semana"
            />
          </Card>
        )}

        <EventDetail
          event={selected}
          canEdit={canEdit}
          canSeeHistory={can(user?.roles, "clinica:ver")}
          updating={updating}
          onStatus={(status) => selected?.kind === "turno" && void updateStatus(selected.id, status)}
        />
      </div>

      {/* Alta de turno */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          title="Nuevo turno"
          description="El paciente recibe la confirmación por email."
          footer={
            <>
              <Button variant="ghost" onClick={() => setSheetOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" form={FORM_ID} busy={saving}>Guardar turno</Button>
            </>
          }
        >
          <form id={FORM_ID} onSubmit={submit} className="space-y-8">
            <Select label="Paciente" value={form.patientId} onChange={(v) => setForm({ ...form, patientId: v })} required>
              <option value="">Seleccionar…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} · DNI {p.documentId}</option>
              ))}
            </Select>
            <DateTimeField label="Fecha y hora" value={form.scheduledAt} onChange={(v) => setForm({ ...form, scheduledAt: v })} required />
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Tipo de turno</span>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de turno">
                {APPOINTMENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={form.type === t.value}
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={cn(
                      "rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors",
                      form.type === t.value ? "bg-navy-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Ej. Traer estudios de laboratorio" />
            <ErrorAlert message={formErr} />
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Grilla día × hora con los eventos y la línea de la hora actual. */
function WeekGrid({
  days,
  events,
  now,
  selectedId,
  onSelect,
}: {
  days: Date[];
  events: AgendaEvent[];
  now: Date;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const todayIndex = days.findIndex((d) => sameDay(d, now));
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const showNowLine = todayIndex >= 0 && nowHour >= FIRST_HOUR && nowHour < LAST_HOUR + 1;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[860px]">
        {/* Encabezado de días */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-100">
          <div />
          {days.map((d, i) => {
            const today = i === todayIndex;
            return (
              <div key={d.toISOString()} className="px-2 py-5 text-center">
                <p className="text-xs text-slate-400">{DAY_NAMES[i]}</p>
                <p
                  className={cn(
                    "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm",
                    today ? "bg-navy-600 font-medium text-white" : "text-slate-700",
                  )}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Cuerpo */}
        <div className="relative grid grid-cols-[56px_repeat(7,1fr)]">
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="pr-2 pt-1 text-right font-mono text-[11px] text-slate-300" style={{ height: ROW_HEIGHT }}>
                {String(hour).padStart(2, "0")}:00
              </div>
              {days.map((d) => {
                const cellEvents = events.filter((e) => sameDay(e.at, d) && hourRow(e.at) === hour);
                return (
                  <div
                    key={d.toISOString() + hour}
                    className="space-y-1 overflow-y-auto border-l border-t border-slate-100/70 p-1"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {cellEvents.map((e) => (
                      <EventChip key={e.id} event={e} selected={e.id === selectedId} onSelect={() => onSelect(e.id)} />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}

          {showNowLine && (
            <div
              className="pointer-events-none absolute left-[56px] right-0 z-10 h-px bg-rose-400"
              style={{ top: (nowHour - FIRST_HOUR) * ROW_HEIGHT }}
              aria-hidden
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Bloque de un evento dentro de la grilla: fondo pastel, sin bordes. */
function EventChip({ event, selected, onSelect }: { event: AgendaEvent; selected: boolean; onSelect: () => void }) {
  const isSurgery = event.kind === "cirugia";
  const tone = isSurgery ? SURGERY_TONE : APPOINTMENT_TYPE_INFO[event.data.type]?.tone ?? "bg-slate-50 text-slate-700";
  const cancelled = event.kind === "turno" && event.data.status === "cancelado";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "block w-full rounded-lg px-2 py-1.5 text-left text-xs leading-snug transition",
        tone,
        selected && "ring-2 ring-navy-600/40",
        cancelled && "opacity-40 line-through",
      )}
    >
      <span className="font-mono opacity-70">{formatTime(event.at)}</span>
      <span className="block truncate font-medium">
        {isSurgery ? event.data.procedure : APPOINTMENT_TYPE_INFO[event.data.type]?.label ?? event.data.type}
      </span>
      <span className="block truncate opacity-70">{event.data.patient.lastName}</span>
    </button>
  );
}

/** Panel lateral con el detalle del evento seleccionado. */
function EventDetail({
  event,
  canEdit,
  canSeeHistory,
  updating,
  onStatus,
}: {
  event: AgendaEvent | null;
  canEdit: boolean;
  /** La recepción no accede a la historia clínica. */
  canSeeHistory: boolean;
  updating: boolean;
  onStatus: (status: string) => void;
}) {
  if (!event) {
    return (
      <Card className="p-8 xl:sticky xl:top-24 xl:self-start">
        <p className="text-sm text-slate-400">Seleccioná un turno o una cirugía para ver su detalle.</p>
      </Card>
    );
  }

  const p = event.data.patient;
  const isSurgery = event.kind === "cirugia";
  const open = !isSurgery && event.data.status !== "cancelado" && event.data.status !== "completado";

  return (
    <Card className="p-8 xl:sticky xl:top-24 xl:self-start">
      <p className="text-sm text-slate-400">
        {isSurgery ? "Cirugía" : APPOINTMENT_TYPE_INFO[event.data.type]?.label ?? event.data.type}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">{p.firstName} {p.lastName}</h2>
      <p className="mt-1 text-sm text-slate-500">{formatDateTime(event.at)}</p>

      <div className="mt-6">
        {isSurgery ? (
          <StatusBadge status={event.data.status} waitingRoom={event.data.waitingRoom} />
        ) : (
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", APPOINTMENT_STATUS_INFO[event.data.status]?.pill)}>
            {APPOINTMENT_STATUS_INFO[event.data.status]?.label ?? event.data.status}
          </span>
        )}
      </div>

      {isSurgery ? (
        <p className="mt-6 text-sm text-slate-700">
          {event.data.procedure}
          <span className="block text-slate-400">
            <span className="font-mono">{formatCode(event.data.publicCode)}</span>
            {event.data.operatingRoom && ` · ${event.data.operatingRoom.name}`}
          </span>
        </p>
      ) : (
        event.data.notes && <p className="mt-6 text-sm text-slate-600">{event.data.notes}</p>
      )}

      {/* Una acción principal según el caso; las demás, como texto. */}
      <div className="mt-8 flex flex-col items-start gap-3">
        {isSurgery ? (
          <Button asChild>
            <Link to={`/surgeries/${event.id}`}>Abrir cirugía</Link>
          </Button>
        ) : (
          canEdit &&
          open && (
            <>
              <Button busy={updating} onClick={() => onStatus(event.data.status === "pendiente" ? "confirmado" : "completado")}>
                {event.data.status === "pendiente" ? "Confirmar turno" : "Marcar completado"}
              </Button>
              <div className="flex gap-4 text-sm">
                {event.data.status === "pendiente" && (
                  <button onClick={() => onStatus("completado")} disabled={updating} className="text-slate-500 hover:text-slate-900">
                    Completado
                  </button>
                )}
                <button onClick={() => onStatus("cancelado")} disabled={updating} className="text-slate-500 hover:text-rose-600">
                  Cancelar turno
                </button>
              </div>
            </>
          )
        )}
        {canSeeHistory && (
          <Link to={`/patients/${p.id}/history`} className="text-sm text-blue-700 hover:underline">
            Ver historia clínica
          </Link>
        )}
      </div>
    </Card>
  );
}

/** Columnas de la vista lista (mismo dataset que la grilla). */
function listColumns(onSelect: (id: string) => void): ColumnDef<AgendaEvent, any>[] {
  return [
    {
      id: "at",
      accessorFn: (e) => e.at.toISOString(),
      header: "Fecha",
      cell: (ctx) => <span className="whitespace-nowrap font-mono text-sm text-slate-900">{formatDateTime(ctx.row.original.at)}</span>,
    },
    {
      id: "kind",
      accessorFn: (e) => (e.kind === "cirugia" ? "Cirugía" : APPOINTMENT_TYPE_INFO[e.data.type]?.label ?? e.data.type),
      header: "Tipo",
      cell: (ctx) => <span className="text-slate-600">{ctx.getValue() as string}</span>,
    },
    {
      id: "patient",
      accessorFn: (e) => `${e.data.patient.lastName}, ${e.data.patient.firstName}`,
      header: "Paciente",
      cell: (ctx) => <span className="text-slate-900">{ctx.getValue() as string}</span>,
    },
    {
      id: "status",
      accessorFn: (e) => e.data.status,
      header: "Estado",
      cell: (ctx) => {
        const e = ctx.row.original;
        return e.kind === "cirugia" ? (
          <StatusBadge status={e.data.status} waitingRoom={e.data.waitingRoom} />
        ) : (
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", APPOINTMENT_STATUS_INFO[e.data.status]?.pill)}>
            {APPOINTMENT_STATUS_INFO[e.data.status]?.label ?? e.data.status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: (ctx) => (
        <button onClick={() => onSelect(ctx.row.original.id)} className="text-sm text-blue-700 hover:underline">
          Ver
        </button>
      ),
    },
  ];
}
