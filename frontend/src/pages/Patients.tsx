// ======================================================
// Pacientes (pages/Patients.tsx)
// Directorio de pacientes con su situación quirúrgica actual,
// reducido a lo necesario para decidir: quién es, qué cirugía
// tiene y en qué estado está (más una alergia, si existe).
// Contacto, medicación e historial viven en la historia clínica.
//   - Alta en panel lateral y baja lógica con confirmación
//     (el backend conserva el registro para el historial).
// La cirugía "vigente" de cada paciente se deriva del listado
// de cirugías ya cacheado: no hace falta otro endpoint.
// ======================================================
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { api, getErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { can } from "../lib/permissions";
import { toast } from "../lib/toast";
import { ACTIVE_STATUSES, STATUS_LABEL } from "../lib/surgery-status";
import { ageFrom, formatCode, formatDate, formatTime, isToday } from "../lib/format";
import { useSurgeriesQuery } from "../hooks/use-surgeries-query";
import { PATIENTS_QUERY_KEY, usePatientsQuery } from "../hooks/use-catalog-queries";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DataTable } from "../components/ui/data-table";
import { ErrorAlert } from "../components/ui/alert";
import { PageHeader } from "../components/ui/page-header";
import { StatusBadge } from "../components/ui/status-badge";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { Sheet, SheetContent } from "../components/ui/sheet";
import { Input } from "../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import type { Patient, Surgery } from "../lib/types";

/** Estado inicial del formulario de alta. */
const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  documentId: "",
  birthDate: "",
  phone: "",
  email: "",
  bloodType: "",
  allergies: "",
};

const FORM_ID = "new-patient-form";

/** Paciente + su cirugía vigente (la activa más próxima, o la última). */
interface PatientRow extends Patient {
  surgery: Surgery | null;
}

/** Elige la cirugía que representa la situación actual del paciente. */
function currentSurgery(list: Surgery[]): Surgery | null {
  const active = list
    .filter((s) => ACTIVE_STATUSES.includes(s.status))
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  if (active.length) return active[0]!;
  return [...list].sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt))[0] ?? null;
}

export default function Patients() {
  const { user } = useAuth();
  const canEdit = can(user?.roles, "pacientes:escribir");
  const canSeeHistory = can(user?.roles, "clinica:ver");
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading, error } = usePatientsQuery();
  const { data: surgeries = [] } = useSurgeriesQuery();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rows: PatientRow[] = useMemo(() => {
    const byPatient = new Map<string, Surgery[]>();
    for (const s of surgeries) {
      const list = byPatient.get(s.patient.id) ?? [];
      list.push(s);
      byPatient.set(s.patient.id, list);
    }
    return patients.map((p) => ({ ...p, surgery: currentSurgery(byPatient.get(p.id) ?? []) }));
  }, [patients, surgeries]);


  /** Alta de paciente: los campos opcionales vacíos viajan como null. */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setSaving(true);
    try {
      await api.post("/api/patients", {
        firstName: form.firstName,
        lastName: form.lastName,
        documentId: form.documentId,
        // Mediodía UTC: así la fecha no se corre al día anterior en husos negativos (UTC-3).
        birthDate: form.birthDate ? `${form.birthDate}T12:00:00.000Z` : null,
        phone: form.phone || null,
        email: form.email || null,
        bloodType: form.bloodType || null,
        allergies: form.allergies || null,
      });
      await queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
      toast.success(`Paciente ${form.lastName}, ${form.firstName} registrado`);
      setForm(EMPTY_FORM);
      setSheetOpen(false);
    } catch (error) {
      setFormErr(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  /** Baja lógica, confirmada desde el diálogo. */
  async function remove() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/patients/${toDelete.id}`);
      await queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
      toast.success("Paciente dado de baja");
      setToDelete(null);
    } catch (error) {
      toast.error(error);
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<PatientRow, any>[] = [
    {
      id: "patient",
      accessorFn: (p) => `${p.lastName} ${p.firstName} ${p.documentId}`,
      header: "Paciente",
      cell: (ctx) => {
        const p = ctx.row.original;
        const age = ageFrom(p.birthDate);
        return (
          <div className="min-w-[180px]">
            <p className="text-slate-900">{p.lastName}, {p.firstName}</p>
            <p className="text-xs text-slate-400">
              DNI {p.documentId}{age !== null && ` · ${age} años`}
            </p>
            {/* Sólo se muestra lo crítico: una alergia registrada. */}
            {p.allergies && <p className="mt-1 text-xs text-rose-600">Alergia: {p.allergies}</p>}
          </div>
        );
      },
    },
    {
      id: "surgery",
      accessorFn: (p) => `${p.surgery?.procedure ?? ""} ${p.surgery?.publicCode ?? ""}`,
      header: "Cirugía vigente",
      cell: (ctx) => {
        const s = ctx.row.original.surgery;
        if (!s) return <span className="text-slate-300">—</span>;
        return (
          <div className="min-w-[180px]">
            <p className="text-slate-900">{s.procedure}</p>
            <p className="text-xs text-slate-400">
              <span className="font-mono">{formatCode(s.publicCode)}</span> · {isToday(s.scheduledAt) ? "Hoy" : formatDate(s.scheduledAt)} {formatTime(s.scheduledAt)}
            </p>
          </div>
        );
      },
    },
    {
      id: "status",
      accessorFn: (p) => (p.surgery ? STATUS_LABEL[p.surgery.status] : ""),
      header: "Estado",
      cell: (ctx) => {
        const s = ctx.row.original.surgery;
        return s ? <StatusBadge status={s.status} waitingRoom={s.waitingRoom} /> : null;
      },
    },
    {
      id: "actions",
      header: "",
      cell: (ctx) => {
        const p = ctx.row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            {/* Historia clínica (la recepción no accede a datos clínicos). */}
            {canSeeHistory && (
              <Link to={`/patients/${p.id}/history`} className="rounded-lg px-3 py-1.5 text-sm text-blue-700 hover:bg-slate-100">
                Historia
              </Link>
            )}
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600" aria-label={`Más acciones para ${p.firstName} ${p.lastName}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {p.surgery && (
                    <DropdownMenuItem asChild>
                      <Link to={`/surgeries/${p.surgery.id}`}>Ver cirugía</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem destructive onClick={() => setToDelete(p)}>
                    Dar de baja
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Pacientes"
        description={`${patients.length} pacientes activos`}
        actions={
          canEdit && (
            <Button onClick={() => { setFormErr(null); setSheetOpen(true); }}>
              <UserPlus className="h-4 w-4" /> Nuevo paciente
            </Button>
          )
        }
      />

      {error && <div className="mb-8"><ErrorAlert message={getErrorMessage(error)} /></div>}

      <Card>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          searchPlaceholder="Buscar por nombre, DNI o código"
          emptyMessage="Sin pacientes registrados"
        />
      </Card>

      {/* Alta de paciente */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          title="Nuevo paciente"
          description="El documento debe ser único."
          footer={
            <>
              <Button variant="ghost" onClick={() => setSheetOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" form={FORM_ID} busy={saving}>Registrar paciente</Button>
            </>
          }
        >
          <form id={FORM_ID} onSubmit={submit} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input label="Nombre" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
            <Input label="Apellido" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
            <Input label="Documento (DNI)" value={form.documentId} onChange={(v) => setForm({ ...form, documentId: v })} required />
            <Input label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} />
            <Input label="Teléfono" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Grupo sanguíneo" value={form.bloodType} onChange={(v) => setForm({ ...form, bloodType: v })} placeholder="Ej. A+" />
            <Input label="Alergias" value={form.allergies} onChange={(v) => setForm({ ...form, allergies: v })} placeholder="Ej. Penicilina" />
            <div className="sm:col-span-2"><ErrorAlert message={formErr} /></div>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Dar de baja al paciente?"
        description={
          toDelete
            ? `${toDelete.firstName} ${toDelete.lastName} dejará de aparecer en el directorio. Su historial clínico y sus cirugías se conservan.`
            : undefined
        }
        confirmLabel="Dar de baja"
        variant="destructive"
        busy={deleting}
        onConfirm={() => void remove()}
      />
    </>
  );
}
