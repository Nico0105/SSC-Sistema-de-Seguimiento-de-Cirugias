import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/surgery-status";

export const Route = createFileRoute("/_authenticated/appointments")({
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["appointments", date],
    queryFn: async () => {
      let qb = supabase.from("appointments").select("*, patients(first_name, last_name, code)").order("scheduled_at", { ascending: false });
      if (date) {
        const start = new Date(date); start.setHours(0, 0, 0, 0);
        const end = new Date(date); end.setHours(23, 59, 59, 999);
        qb = qb.gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString());
      }
      const { data, error } = await qb;
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageContainer>
      <PageHeader title="Turnos" description="Programación de turnos clínicos y preoperatorios."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nuevo turno</Button></DialogTrigger>
            <NewAppointmentDialog onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["appointments"] }); }} />
          </Dialog>
        }
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <Label className="text-xs">Filtrar por fecha</Label>
          <Input type="date" className="w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
          {date && <Button variant="ghost" size="sm" onClick={() => setDate("")}>Limpiar</Button>}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-3">Fecha y hora</th>
              <th className="text-left px-6 py-3">Paciente</th>
              <th className="text-left px-6 py-3">Tipo</th>
              <th className="text-left px-6 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">Sin turnos.</td></tr>}
            {data.map((a: any) => (
              <tr key={a.id} className="border-t">
                <td className="px-6 py-3">{formatDateTime(a.scheduled_at)}</td>
                <td className="px-6 py-3 font-medium">{a.patients?.last_name}, {a.patients?.first_name}</td>
                <td className="px-6 py-3">{a.appointment_type}</td>
                <td className="px-6 py-3 capitalize">{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PageContainer>
  );
}

function NewAppointmentDialog({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ patient_id: "", scheduled_at: "", appointment_type: "Consulta preoperatoria", notes: "" });
  const [busy, setBusy] = useState(false);
  const { data: patients = [] } = useQuery({
    queryKey: ["patients", "options"],
    queryFn: async () => (await supabase.from("patients").select("id, first_name, last_name").is("deleted_at", null).order("last_name")).data ?? [],
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("appointments").insert({
      ...form, scheduled_at: new Date(form.scheduled_at).toISOString(), created_by: u.user?.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Turno creado");
    onCreated();
  }
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nuevo turno</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label className="text-xs">Paciente</Label>
          <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.last_name}, {p.first_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">Fecha y hora</Label><Input type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Tipo</Label><Input value={form.appointment_type} onChange={(e) => setForm({ ...form, appointment_type: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Observaciones</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <DialogFooter><Button disabled={busy || !form.patient_id} type="submit">{busy ? "Guardando…" : "Crear turno"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
