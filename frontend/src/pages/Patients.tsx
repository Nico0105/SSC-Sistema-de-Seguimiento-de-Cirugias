// ======================================================
// Gestión de pacientes (pages/Patients.tsx)
// Listado y alta de pacientes, con baja lógica (el backend
// conserva el registro para el historial clínico). Las
// acciones de escritura sólo se muestran a los roles ABM;
// la validación real la hace siempre el backend.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { ABM_ROLES, hasAnyRole } from "../lib/permissions";
import { EmptyRow, ErrorAlert, Input, Loading, PrimaryButton, TableCard } from "../components/ui";
import type { Patient } from "../lib/types";

/** Estado inicial del formulario de alta. */
const EMPTY_FORM = { firstName: "", lastName: "", documentId: "", phone: "", email: "", bloodType: "" };

/** Campos del formulario con sus etiquetas visibles. */
const FORM_FIELDS: { key: keyof typeof EMPTY_FORM; label: string; required?: boolean; type?: string }[] = [
  { key: "firstName", label: "Nombre", required: true },
  { key: "lastName", label: "Apellido", required: true },
  { key: "documentId", label: "Documento", required: true },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Email", type: "email" },
  { key: "bloodType", label: "Grupo sanguíneo" },
];

export default function Patients() {
  const { user } = useAuth();
  const canEdit = hasAnyRole(user?.roles, ABM_ROLES);

  const [list, setList] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      setList(await api.get<Patient[]>("/api/patients"));
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /** Alta de paciente: los campos opcionales vacíos viajan como null. */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api.post("/api/patients", {
        ...form,
        phone: form.phone || null,
        email: form.email || null,
        bloodType: form.bloodType || null,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  /** Baja lógica con confirmación previa. */
  async function remove(id: string) {
    if (!confirm("¿Eliminar paciente? El registro se conserva para el historial.")) return;
    try {
      await api.delete(`/api/patients/${id}`);
      await load();
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
        {canEdit && (
          <PrimaryButton type="button" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Nuevo paciente"}
          </PrimaryButton>
        )}
      </div>

      {showForm && canEdit && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {FORM_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              type={f.type}
              value={form[f.key]}
              onChange={(v) => setForm({ ...form, [f.key]: v })}
              required={f.required}
            />
          ))}
          <div className="md:col-span-3"><ErrorAlert message={err} /></div>
          <div className="md:col-span-3">
            <PrimaryButton busy={saving}>Guardar</PrimaryButton>
          </div>
        </form>
      )}

      {!showForm && <div className="mb-4"><ErrorAlert message={err} /></div>}

      <TableCard>
        {loading ? (
          <Loading />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-6 py-3">Documento</th>
                <th className="text-left px-6 py-3">Nombre</th>
                <th className="text-left px-6 py-3">Contacto</th>
                <th className="text-left px-6 py-3">Sangre</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 font-mono text-xs">{p.documentId}</td>
                  <td className="px-6 py-3">{p.lastName}, {p.firstName}</td>
                  <td className="px-6 py-3 text-slate-500">{p.phone ?? p.email ?? "—"}</td>
                  <td className="px-6 py-3">{p.bloodType ?? "—"}</td>
                  <td className="px-6 py-3 text-right space-x-3 whitespace-nowrap">
                    {/* Historial clínico consolidado del paciente. */}
                    <Link to={`/patients/${p.id}/history`} className="text-brand-600 text-xs hover:underline">
                      Historia →
                    </Link>
                    {canEdit && (
                      <button onClick={() => void remove(p.id)} className="text-rose-600 text-xs hover:underline">
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <EmptyRow colSpan={5}>Sin pacientes</EmptyRow>}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}
