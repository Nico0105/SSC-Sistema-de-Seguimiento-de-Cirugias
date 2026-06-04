import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABELS, STATUS_STYLES, formatTime } from "@/lib/surgery-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/board")({
  ssr: false,
  head: () => ({ meta: [{ title: "SSC · Pantalla familiares" }] }),
  component: BoardPage,
});

type Row = {
  id: string;
  public_code: string;
  status: string;
  scheduled_at: string;
  estimated_end_at: string | null;
  updated_at: string;
  operating_room_id: string | null;
};

function BoardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [rooms, setRooms] = useState<Record<string, string>>({});
  const [now, setNow] = useState(new Date());

  async function load() {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const { data } = await supabase
      .from("surgeries")
      .select("id, public_code, status, scheduled_at, estimated_end_at, updated_at, operating_room_id")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at");
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => {
    load();
    supabase.from("operating_rooms").select("id, name").then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { map[r.id] = r.name; });
      setRooms(map);
    });
    const ch = supabase.channel("board-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "surgeries" }, () => load())
      .subscribe();
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-10 py-6 border-b border-border flex items-center justify-between"
              style={{ background: "var(--gradient-medical)", color: "var(--primary-foreground)" }}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur grid place-items-center">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] opacity-80">Sistema de Seguimiento de Cirugías</div>
            <h1 className="text-2xl font-semibold leading-tight">Información para familiares</h1>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums">{now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="text-xs opacity-80 capitalize">{now.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" })}</div>
        </div>
      </header>

      <main className="flex-1 p-10">
        {rows.length === 0 ? (
          <div className="h-full grid place-items-center text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl font-medium">Hoy no hay cirugías programadas</div>
              <p className="mt-2">Esta pantalla se actualiza automáticamente.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {rows.map((s) => (
              <div key={s.id} className="rounded-2xl bg-card border p-6 flex flex-col gap-4"
                   style={{ boxShadow: "var(--shadow-elevated)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Código</div>
                    <div className="text-3xl font-bold font-mono tracking-tight">{s.public_code}</div>
                  </div>
                  <span className={cn("px-3 py-1.5 rounded-full border text-sm font-medium", STATUS_STYLES[s.status])}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[11px] uppercase text-muted-foreground tracking-wider">Programada</div>
                    <div className="font-medium">{formatTime(s.scheduled_at)} hs</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase text-muted-foreground tracking-wider">Quirófano</div>
                    <div className="font-medium">{s.operating_room_id ? rooms[s.operating_room_id] ?? "—" : "—"}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pt-3 border-t">
                  Última actualización · {formatTime(s.updated_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="px-10 py-4 text-center text-xs text-muted-foreground border-t">
        Los datos personales no se muestran por privacidad. Para consultas, dirigirse al personal del hospital.
      </footer>
    </div>
  );
}
