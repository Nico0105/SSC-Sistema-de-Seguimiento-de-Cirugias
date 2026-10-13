// ======================================================
// Notificaciones (pages/EmailLogs.tsx)
// Auditoría de los correos que el sistema envió (o intentó
// enviar) vía Brevo: confirmaciones, reprogramaciones,
// recordatorios 48/24 h, indicaciones, altas y mensajes del
// médico. Muestra tres métricas, una lista simple filtrable
// por resultado y, plegada, la explicación de qué envía el
// sistema automáticamente (divulgación progresiva).
// ======================================================
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { api, getErrorMessage } from "../lib/api-client";
import { formatDateTime, formatRelative, isToday } from "../lib/format";
import { cn } from "../lib/cn";
import { useClock } from "../hooks/use-clock";
import { Card } from "../components/ui/card";
import { ErrorAlert } from "../components/ui/alert";
import { FilterPills, type FilterOption } from "../components/ui/filter-pills";
import { KpiCard } from "../components/ui/kpi-card";
import { PageHeader } from "../components/ui/page-header";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import type { EmailLog } from "../lib/types";

/** Etiquetas legibles de cada tipo de email. */
const TYPE_LABEL: Record<string, string> = {
  confirmacion_cirugia: "Confirmación de cirugía",
  reprogramacion_cirugia: "Cambio de fecha",
  recordatorio_48h: "Recordatorio 48 h",
  recordatorio_24h: "Recordatorio 24 h",
  indicaciones_preoperatorias: "Indicaciones preoperatorias",
  alta_medica: "Alta médica",
  confirmacion_control: "Confirmación de turno",
  mensaje_medico: "Mensaje del médico",
  prueba: "Prueba de envío",
};

/** Resultado del envío: texto y color (sólo se destaca lo que requiere atención). */
const STATUS_INFO: Record<string, { label: string; className: string }> = {
  enviado: { label: "Enviado", className: "text-slate-500" },
  fallido: { label: "Falló", className: "rounded-full bg-rose-50 px-2.5 py-0.5 text-rose-700" },
  omitido: { label: "Omitido", className: "text-slate-400" },
};

type Filter = "todos" | "enviado" | "fallido" | "omitido";

const PAGE = 25;

export default function EmailLogs() {
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["email-logs"],
    queryFn: () => api.get<EmailLog[]>("/api/email-logs"),
    refetchInterval: 60_000,
  });
  const now = useClock(60_000);
  const [filter, setFilter] = useState<Filter>("todos");
  const [limit, setLimit] = useState(PAGE);

  const stats = useMemo(() => {
    const count = (s: string) => logs.filter((l) => l.status === s).length;
    const sent = count("enviado");
    const failed = count("fallido");
    return {
      sentToday: logs.filter((l) => l.status === "enviado" && isToday(l.createdAt)).length,
      sent,
      failed,
      skipped: count("omitido"),
      deliveryRate: sent + failed > 0 ? Math.round((sent / (sent + failed)) * 100) : null,
    };
  }, [logs]);

  const visible = filter === "todos" ? logs : logs.filter((l) => l.status === filter);
  const options: FilterOption<Filter>[] = [
    { value: "todos", label: "Todos", count: logs.length },
    { value: "enviado", label: "Enviados", count: stats.sent },
    { value: "fallido", label: "Fallidos", count: stats.failed },
    { value: "omitido", label: "Omitidos", count: stats.skipped },
  ];

  return (
    <>
      <PageHeader title="Notificaciones" description="Emails automáticos enviados a los pacientes." />

      {error && <div className="mb-8"><ErrorAlert message={getErrorMessage(error)} /></div>}

      <section className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-3" aria-label="Resumen de envíos">
        <KpiCard label="Enviados hoy" value={stats.sentToday} loading={isLoading} />
        <KpiCard
          label="Tasa de entrega"
          value={stats.deliveryRate !== null ? `${stats.deliveryRate}%` : "—"}
          loading={isLoading}
        />
        <KpiCard label="Fallidos" value={stats.failed} tone={stats.failed > 0 ? "danger" : "navy"} loading={isLoading} />
      </section>

      <Card>
        <div className="px-8 pt-7 pb-2">
          <FilterPills options={options} value={filter} onChange={(f) => { setFilter(f); setLimit(PAGE); }} ariaLabel="Filtrar por resultado" />
        </div>

        <div className="px-8 pb-6">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">Sin envíos para este filtro.</p>
          ) : (
            <ol className="divide-y divide-slate-100">
              {visible.slice(0, limit).map((log) => {
                const info = STATUS_INFO[log.status] ?? STATUS_INFO.omitido!;
                return (
                  <li key={log.id} className="flex flex-col gap-1 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-900">{TYPE_LABEL[log.type] ?? log.subject}</p>
                      <p className="truncate text-xs text-slate-400">
                        {log.to}
                        {log.surgery && ` · ${log.surgery.procedure}`}
                      </p>
                      {/* El motivo de un fallo es lo único que se muestra en detalle. */}
                      {log.status === "fallido" && log.error && <p className="mt-1 text-xs text-rose-600">{log.error}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-xs">
                      <span className={info.className} title={log.status === "omitido" ? log.error ?? undefined : undefined}>
                        {info.label}
                      </span>
                      <span className="w-24 text-right text-slate-400" title={formatDateTime(log.createdAt)}>
                        {formatRelative(log.createdAt, now)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {visible.length > limit && (
            <div className="pt-4 text-center">
              <Button variant="ghost" onClick={() => setLimit(limit + PAGE)}>Ver más</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Detalle secundario, plegado */}
      <details className="group mt-10 text-sm text-slate-500">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 hover:text-slate-800">
          <ChevronDown className={cn("h-4 w-4 transition-transform group-open:rotate-180")} />
          ¿Qué notificaciones envía el sistema?
        </summary>
        <ul className="mt-4 space-y-2 pl-6">
          <li>Email de confirmación e indicaciones al programar una cirugía.</li>
          <li>Recordatorios por email 48 h y 24 h antes, y aviso si cambia la fecha.</li>
          <li>Push al paciente en cada cambio de estado, nuevo control postoperatorio y alta.</li>
          <li>"Omitido" significa que el paciente no tiene email o que el canal no está configurado.</li>
        </ul>
      </details>
    </>
  );
}
