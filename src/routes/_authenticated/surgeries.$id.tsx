import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CircleDot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, STATUS_ORDER, STATUS_STYLES, formatDateTime } from "@/lib/surgery-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/surgeries/$id")({
  component: SurgeryDetail,
});

function SurgeryDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: surgery } = useQuery({
    queryKey: ["surgery", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("surgeries")
        .select("*, patients(*), operating_rooms(name), profiles(full_name)")
        .eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["surgery-history", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("surgery_status_history")
        .select("*").eq("surgery_id", id).order("changed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`surgery-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "surgeries", filter: `id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["surgery", id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "surgery_status_history", filter: `surgery_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["surgery-history", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  const update = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("surgeries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Estado actualizado"),
    onError: (e: any) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("surgeries").update({ status: "cancelada" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Cirugía cancelada"),
  });

  if (!surgery) return <PageContainer><div className="text-muted-foreground">Cargando…</div></PageContainer>;

  const currentIdx = STATUS_ORDER.indexOf(surgery.status as any);

  return (
    <PageContainer>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
        <Link to="/surgeries"><ArrowLeft className="h-4 w-4 mr-1" />Volver a cirugías</Link>
      </Button>

      <PageHeader
        title={`${surgery.surgery_type}`}
        description={`Código público: ${surgery.public_code} · ${surgery.patients?.last_name}, ${surgery.patients?.first_name}`}
        actions={
          <>
            <Badge variant="outline" className={cn("border text-sm py-1.5 px-3", STATUS_STYLES[surgery.status])}>
              {STATUS_LABELS[surgery.status]}
            </Badge>
            {surgery.status !== "cancelada" && (
              <Button variant="outline" onClick={() => { if (confirm("¿Cancelar cirugía?")) cancel.mutate(); }}>Cancelar</Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Línea de tiempo quirúrgica</h3>
          <div className="grid grid-cols-7 gap-2 mb-6">
            {STATUS_ORDER.map((st, i) => {
              const done = i <= currentIdx;
              return (
                <div key={st} className="flex flex-col items-center text-center">
                  <div className={cn("h-8 w-8 rounded-full grid place-items-center text-xs font-medium",
                    done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {i + 1}
                  </div>
                  <div className="text-[11px] mt-2 text-muted-foreground leading-tight">{STATUS_LABELS[st]}</div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {STATUS_ORDER.map((st) => (
              <Button key={st} variant={st === surgery.status ? "default" : "outline"} size="sm"
                disabled={surgery.status === "cancelada"}
                onClick={() => update.mutate(st)}>
                {STATUS_LABELS[st]}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Detalles</h3>
          <Info label="Paciente" value={`${surgery.patients?.last_name}, ${surgery.patients?.first_name}`} />
          <Info label="DNI" value={surgery.patients?.dni ?? "—"} />
          <Info label="Programada" value={formatDateTime(surgery.scheduled_at)} />
          <Info label="Quirófano" value={surgery.operating_rooms?.name ?? "—"} />
          <Info label="Médico" value={surgery.profiles?.full_name ?? "—"} />
          {surgery.notes && <Info label="Observaciones" value={surgery.notes} />}
        </Card>

        <Card className="xl:col-span-3 p-6">
          <h3 className="font-semibold mb-4">Historial de estados</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cambios registrados.</p>
          ) : (
            <ol className="relative border-l border-border pl-6 space-y-4">
              {history.map((h: any) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary"><CircleDot className="hidden" /></span>
                  <div className="flex items-baseline gap-3">
                    <Badge variant="outline" className={cn("border", STATUS_STYLES[h.status])}>{STATUS_LABELS[h.status]}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDateTime(h.changed_at)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
