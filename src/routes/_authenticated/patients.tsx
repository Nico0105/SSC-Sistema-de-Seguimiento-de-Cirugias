import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/surgery-status";

export const Route = createFileRoute("/_authenticated/patients")({
  component: PatientsPage,
});

function PatientsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", q],
    queryFn: async () => {
      let qb = supabase.from("patients").select("*").is("deleted_at", null).order("created_at", { ascending: false });
      if (q) qb = qb.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,code.ilike.%${q}%,dni.ilike.%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Paciente eliminado"); qc.invalidateQueries({ queryKey: ["patients"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <PageContainer>
      <PageHeader title="Pacientes" description="Alta, búsqueda y baja lógica de pacientes."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Nuevo paciente</Button></DialogTrigger>
            <NewPatientDialog onCreated={(id) => { setOpen(false); qc.invalidateQueries({ queryKey: ["patients"] }); navigate({ to: "/patients" }); void id; }} />
          </Dialog>
        }
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, DNI o código…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="text-xs text-muted-foreground ml-auto">{patients.length} resultados</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3">Código</th>
                <th className="text-left px-6 py-3">Nombre</th>
                <th className="text-left px-6 py-3">DNI</th>
                <th className="text-left px-6 py-3">Nacimiento</th>
                <th className="text-left px-6 py-3">Contacto</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">Cargando…</td></tr>}
              {!isLoading && patients.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">Sin pacientes registrados.</td></tr>
              )}
              {patients.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-muted/30 transition">
                  <td className="px-6 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-6 py-3 font-medium">
                    <Link to="/surgeries" className="hover:underline">{p.last_name}, {p.first_name}</Link>
                  </td>
                  <td className="px-6 py-3">{p.dni ?? "—"}</td>
                  <td className="px-6 py-3">{formatDate(p.birth_date)}</td>
                  <td className="px-6 py-3 text-muted-foreground">{p.phone ?? p.email ?? "—"}</td>
                  <td className="px-6 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("¿Eliminar paciente?")) del.mutate(p.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}

function NewPatientDialog({ onCreated }: { onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", dni: "", birth_date: "", phone: "", email: "", notes: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const code = "PAC-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("patients").insert({
      ...form, code, birth_date: form.birth_date || null, created_by: u.user?.id,
    }).select("id").single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Paciente creado");
    onCreated(data.id);
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Nuevo paciente</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <Field label="Nombre"><Input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
        <Field label="Apellido"><Input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
        <Field label="DNI"><Input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} /></Field>
        <Field label="Fecha de nacimiento"><Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></Field>
        <Field label="Teléfono"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <div className="col-span-2"><Field label="Observaciones"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        <DialogFooter className="col-span-2">
          <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Crear paciente"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
