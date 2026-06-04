import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { STATUS_LABELS, STATUS_STYLES, formatDateTime } from "@/lib/surgery-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/surgeries/")({
  component: SurgeriesPage,
});

function SurgeriesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["surgeries", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surgeries")
        .select("id, public_code, surgery_type, status, scheduled_at, patients(first_name, last_name, code), operating_rooms(name), profiles(full_name)")
        .is("deleted_at", null)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel("surgeries-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "surgeries" },
        () => qc.invalidateQueries({ queryKey: ["surgeries"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <PageContainer>
      <PageHeader title="Cirugías" description="Programación, asignación de quirófano y seguimiento."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nueva cirugía</Button></DialogTrigger>
            <NewSurgeryDialog onCreated={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["surgeries"] }); }} />
          </Dialog>
        }
      />

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3">Código</th>
                <th className="text-left px-6 py-3">Paciente</th>
                <th className="text-left px-6 py-3">Tipo</th>
                <th className="text-left px-6 py-3">Quirófano</th>
                <th className="text-left px-6 py-3">Programada</th>
                <th className="text-left px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">Sin cirugías programadas.</td></tr>}
              {data.map((s: any) => (
                <tr key={s.id} className="border-t hover:bg-muted/30 cursor-pointer">
                  <td className="px-6 py-3 font-mono text-xs">
                    <Link to="/surgeries/$id" params={{ id: s.id }} className="hover:underline">{s.public_code}</Link>
                  </td>
                  <td className="px-6 py-3 font-medium">{s.patients?.last_name}, {s.patients?.first_name}</td>
                  <td className="px-6 py-3">{s.surgery_type}</td>
                  <td className="px-6 py-3 text-muted-foreground">{s.operating_rooms?.name ?? "—"}</td>
                  <td className="px-6 py-3">{formatDateTime(s.scheduled_at)}</td>
                  <td className="px-6 py-3"><Badge variant="outline" className={cn("border", STATUS_STYLES[s.status])}>{STATUS_LABELS[s.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}

function NewSurgeryDialog({ onCreated }: { onCreated: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ patient_id: "", surgery_type: "", scheduled_at: "", operating_room_id: "", doctor_id: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients", "options"],
    queryFn: async () => (await supabase.from("patients").select("id, first_name, last_name, code").is("deleted_at", null).order("last_name")).data ?? [],
  });
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => (await supabase.from("operating_rooms").select("id, name").eq("active", true).order("name")).data ?? [],
  });
  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name")).data ?? [],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const public_code = "CIR-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const { data: u } = await supabase.auth.getUser();
    const payload: any = {
      patient_id: form.patient_id,
      surgery_type: form.surgery_type,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      operating_room_id: form.operating_room_id || null,
      doctor_id: form.doctor_id || null,
      notes: form.notes || null,
      public_code, created_by: u.user?.id,
    };
    const { data, error } = await supabase.from("surgeries").insert(payload).select("id").single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Cirugía programada");
    onCreated();
    navigate({ to: "/surgeries/$id", params: { id: data.id } });
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Programar cirugía</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Paciente">
          <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
            <SelectContent>
              {patients.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.last_name}, {p.first_name} ({p.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Tipo de cirugía"><Input required value={form.surgery_type} onChange={(e) => setForm({ ...form, surgery_type: e.target.value })} placeholder="Ej: Colecistectomía laparoscópica" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha y hora"><Input type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></Field>
          <Field label="Quirófano">
            <Select value={form.operating_room_id} onValueChange={(v) => setForm({ ...form, operating_room_id: v })}>
              <SelectTrigger><SelectValue placeholder="Asignar" /></SelectTrigger>
              <SelectContent>{rooms.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Médico responsable">
          <Select value={form.doctor_id} onValueChange={(v) => setForm({ ...form, doctor_id: v })}>
            <SelectTrigger><SelectValue placeholder="Asignar" /></SelectTrigger>
            <SelectContent>{doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name ?? "Sin nombre"}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Observaciones"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <DialogFooter><Button type="submit" disabled={busy || !form.patient_id}>{busy ? "Guardando…" : "Programar"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
