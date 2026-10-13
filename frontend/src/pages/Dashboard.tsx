// ======================================================
// Inicio — Centro de comando (pages/Dashboard.tsx)
// Responde tres preguntas, en orden de lectura:
//   1. ¿Cómo va el día?  → tres métricas (cirugías de hoy,
//      quirófanos ocupados, demoras).
//   2. ¿Qué pasa en cada quirófano? → una tarjeta por sala.
//   3. ¿Qué sigue? → la agenda quirúrgica de hoy.
// Todo se recalcula solo: las cirugías se invalidan ante cada
// evento de Socket.IO y un reloj de 30 s actualiza demoras y
// tiempos en curso sin pedir nada al servidor.
// ======================================================
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MonitorPlay, Plus } from "lucide-react";
import { useSurgeriesQuery } from "../hooks/use-surgeries-query";
import { useRoomsQuery } from "../hooks/use-catalog-queries";
import { useClock } from "../hooks/use-clock";
import { useAuth } from "../lib/auth-context";
import { can } from "../lib/permissions";
import { getErrorMessage } from "../lib/api-client";
import { formatLongDate, isToday } from "../lib/format";
import { buildDayStats, buildRoomSnapshots } from "../lib/room-status";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DataTable } from "../components/ui/data-table";
import { ErrorAlert } from "../components/ui/alert";
import { FilterPills, type FilterOption } from "../components/ui/filter-pills";
import { KpiCard } from "../components/ui/kpi-card";
import { PageHeader } from "../components/ui/page-header";
import { Skeleton } from "../components/ui/skeleton";
import { RoomCard } from "../components/RoomCard";
import { buildSurgeryColumns } from "../components/SurgeryColumns";

type DayFilter = "todas" | "en_curso" | "pendientes";

const columns = buildSurgeryColumns({ showDate: false });

export default function Dashboard() {
  const { user } = useAuth();
  const { data: surgeries = [], isLoading, error } = useSurgeriesQuery();
  const { data: rooms = [], isLoading: roomsLoading } = useRoomsQuery();
  // Reloj de 30 s: suficiente para demoras y tiempos en curso.
  const now = useClock(30_000);
  const [filter, setFilter] = useState<DayFilter>("todas");

  const stats = useMemo(() => buildDayStats(surgeries, rooms, now), [surgeries, rooms, now]);
  const snapshots = useMemo(() => buildRoomSnapshots(rooms, surgeries, now), [rooms, surgeries, now]);

  const today = useMemo(
    () =>
      surgeries
        .filter((s) => isToday(s.scheduledAt) && s.status !== "cancelada")
        .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)),
    [surgeries],
  );
  const inProgress = today.filter((s) => s.status === "en_quirofano" || s.status === "esperando_en_sala");
  const pending = today.filter((s) => s.status === "programada");
  const visible = filter === "en_curso" ? inProgress : filter === "pendientes" ? pending : today;

  const filterOptions: FilterOption<DayFilter>[] = [
    { value: "todas", label: "Todas", count: today.length },
    { value: "en_curso", label: "En curso", count: inProgress.length },
    { value: "pendientes", label: "Pendientes", count: pending.length },
  ];

  const firstDelay = stats.delayed[0];

  return (
    <>
      <PageHeader
        title="Hoy"
        description={formatLongDate(now)}
        actions={
          <>
            {/* Se abre en otra pestaña para dejarla fija en el televisor de la sala de espera. */}
            <Button variant="secondary" asChild>
              <a href="/board" target="_blank" rel="noreferrer">
                <MonitorPlay className="h-4 w-4" /> Pantalla de sala de espera
              </a>
            </Button>
            {can(user?.roles, "cirugias:escribir") && (
              <Button asChild>
                <Link to="/surgeries?nueva=1">
                  <Plus className="h-4 w-4" /> Programar cirugía
                </Link>
              </Button>
            )}
          </>
        }
      />

      {error && (
        <div className="mb-8">
          <ErrorAlert message={getErrorMessage(error)} />
        </div>
      )}

      {/* 1 · Cómo va el día */}
      <section className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-3" aria-label="Resumen del día">
        <KpiCard
          label="Cirugías de hoy"
          value={stats.total}
          loading={isLoading}
          footer={`${stats.active} en curso · ${stats.pending} pendientes`}
        />
        <KpiCard
          label="Quirófanos ocupados"
          value={stats.busyRooms}
          unit={`de ${stats.activeRooms}`}
          loading={isLoading || roomsLoading}
        />
        <KpiCard
          label="Demoras"
          value={stats.delayed.length}
          tone={stats.delayed.length > 0 ? "danger" : "navy"}
          loading={isLoading}
          footer={
            firstDelay ? (
              <Link to={`/surgeries/${firstDelay.id}`} className="hover:text-slate-700">
                {firstDelay.procedure} — ver detalle
              </Link>
            ) : (
              "Todo en horario"
            )
          }
        />
      </section>

      {/* 2 · Quirófanos */}
      <section className="mb-14" aria-labelledby="rooms-title">
        <h2 id="rooms-title" className="mb-6 text-lg font-semibold text-slate-900">Quirófanos</h2>
        {roomsLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : snapshots.length === 0 ? (
          <p className="text-sm text-slate-400">No hay quirófanos activos cargados.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {snapshots.map((snap) => <RoomCard key={snap.room.id} snapshot={snap} now={now} />)}
          </div>
        )}
      </section>

      {/* 3 · Agenda del día */}
      <Card>
        <DataTable
          columns={columns}
          data={visible}
          isLoading={isLoading}
          searchPlaceholder="Buscar"
          emptyMessage={filter === "todas" ? "No hay cirugías para hoy" : "Ninguna cirugía en este grupo"}
          title={<h2 className="text-lg font-semibold text-slate-900">Agenda de hoy</h2>}
          toolbar={<FilterPills options={filterOptions} value={filter} onChange={setFilter} ariaLabel="Filtrar agenda" />}
        />
      </Card>
    </>
  );
}
