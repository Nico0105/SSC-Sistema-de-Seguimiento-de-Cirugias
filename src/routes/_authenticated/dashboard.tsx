import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertCircle, CalendarClock, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, STATUS_STYLES, formatTime } from "@/lib/surgery-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const ACTIVE_STATES = ["ingreso", "preparacion", "en_quirofano", "recuperacion"];

function Dashboard() {
  const qc = useQueryClient();

  const { data: today = [] } = useQuery({
    queryKey: ["surgeries", "today"],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from("surgeries")
        .select("id, public_code, surgery_type, status, scheduled_at, operating_room_id, patients(first_name, last_name, code), operating_rooms(name)")
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .is("deleted_at", null)
        .order("scheduled_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel("dashboard-surgeries")
      .on("postgres_changes", { event: "*", schema: "public", table: "surgeries" },
        () => qc.invalidateQueries({ queryKey: ["surgeries"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const inProcess = today.filter((s: any) => ACTIVE_STATES.includes(s.status));
  const upcoming = today.filter((s: any) => s.status === "programada");
  const finished = today.filter((s: any) => ["finalizada", "alta"].includes(s.status));

  return (
    <PageContainer>
      <PageHeader title="Dashboard quirúrgico" description="Panorama operativo del día con actualización en tiempo real."
        actions={<Button asChild variant="outline"><Link to="/board" target="_blank">Abrir pantalla familiares</Link></Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Stat label="Cirugías hoy" value={today.length} icon={Stethoscope} tone="primary" />
        <Stat label="En proceso" value={inProcess.length} icon={Activity} tone="info" />
        <Stat label="Próximas" value={upcoming.length} icon={CalendarClock} tone="warning" />
        <Stat label="Finalizadas" value={finished.length} icon={AlertCircle} tone="success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-0 overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Cirugías en curso</h2>
            <p className="text-xs text-muted-foreground">Estados activos en tiempo real</p>
          </div>
          {inProcess.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No hay cirugías en proceso.</div>
          ) : (
            <div className="divide-y">
              {inProcess.map((s: any) => (
                <Link key={s.id} to="/surgeries/$id" params={{ id: s.id }}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40 transition">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground font-mono">{s.public_code}</div>
                    <div className="font-medium truncate">{s.patients?.last_name}, {s.patients?.first_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.surgery_type} · {s.operating_rooms?.name ?? "—"}</div>
                  </div>
                  <Badge variant="outline" className={cn("border", STATUS_STYLES[s.status])}>
                    {STATUS_LABELS[s.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Próximas hoy</h2>
            <p className="text-xs text-muted-foreground">Aún sin ingreso</p>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Sin próximas cirugías.</div>
          ) : (
            <div className="divide-y">
              {upcoming.map((s: any) => (
                <Link key={s.id} to="/surgeries/$id" params={{ id: s.id }} className="block px-6 py-3 hover:bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-muted-foreground">{s.public_code}</div>
                    <div className="text-sm font-medium">{formatTime(s.scheduled_at)}</div>
                  </div>
                  <div className="text-sm truncate">{s.surgery_type}</div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}

function Stat({ label, value, icon: Icon, tone }: any) {
  const toneMap: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    info: "text-info bg-info/15",
    warning: "text-warning-foreground bg-warning/25",
    success: "text-success bg-success/15",
  };
  return (
    <Card className="p-5 flex items-center gap-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={cn("h-11 w-11 rounded-lg grid place-items-center", toneMap[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-semibold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </Card>
  );
}
