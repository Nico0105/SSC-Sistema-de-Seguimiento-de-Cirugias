// ======================================================
// Gestión de usuarios (pages/Users.tsx)
// Página exclusiva del administrador: alta de usuarios,
// edición de roles, activación/desactivación y reseteo de
// contraseñas. El backend impide que un admin se desactive
// o se quite su propio rol; acá se refleja el error si ocurre.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { ADMIN_ROLES, ROLE_LABEL, hasAnyRole, type Role } from "../lib/permissions";
import { EmptyRow, ErrorAlert, Input, Loading, PrimaryButton, TableCard } from "../components/ui";

interface AppUser {
  id: string;
  email: string;
  fullName: string;
  active: boolean;
  roles: Role[];
}

const ALL_ROLES = Object.keys(ROLE_LABEL) as Role[];
const EMPTY_FORM = { email: "", password: "", fullName: "", roles: [] as Role[], patientId: "" };

interface PatientOption { id: string; firstName: string; lastName: string; documentId: string }

export default function Users() {
  const { user: me } = useAuth();

  const [list, setList] = useState<AppUser[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<Role[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      // Los pacientes se cargan para poder vincular cuentas con rol "paciente".
      const [users, pats] = await Promise.all([
        api.get<AppUser[]>("/api/users"),
        api.get<PatientOption[]>("/api/patients"),
      ]);
      setList(users);
      setPatients(pats);
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Doble protección: la ruta también está restringida en el backend.
  if (!hasAnyRole(me?.roles, ADMIN_ROLES)) return <Navigate to="/dashboard" replace />;

  /** Agrega o quita un rol de una lista (checkboxes). */
  function toggleRole(role: Role, roles: Role[], setRoles: (r: Role[]) => void) {
    setRoles(roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api.post("/api/users", {
        ...form,
        // El vínculo con un paciente sólo aplica a cuentas con ese rol.
        patientId: form.roles.includes("paciente") && form.patientId ? form.patientId : null,
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

  async function saveRoles(id: string) {
    setErr(null);
    try {
      await api.patch(`/api/users/${id}`, { roles: editRoles });
      setEditingId(null);
      await load();
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }

  async function toggleActive(u: AppUser) {
    setErr(null);
    try {
      await api.patch(`/api/users/${u.id}`, { active: !u.active });
      await load();
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }

  async function resetPassword(id: string) {
    const password = window.prompt("Nueva contraseña (mínimo 8 caracteres):");
    if (!password) return;
    if (password.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setErr(null);
    try {
      await api.patch(`/api/users/${id}/password`, { password });
      alert("Contraseña actualizada");
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
        <PrimaryButton type="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "+ Nuevo usuario"}
        </PrimaryButton>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre completo" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Input label="Contraseña inicial" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required minLength={8} />
          <div>
            <span className="text-xs font-medium text-slate-600 mb-1 block">Roles</span>
            <div className="flex flex-wrap gap-3 pt-2">
              {ALL_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(role)}
                    onChange={() => toggleRole(role, form.roles, (r) => setForm({ ...form, roles: r }))}
                  />
                  {ROLE_LABEL[role]}
                </label>
              ))}
            </div>
          </div>
          {/* Cuando la cuenta es de un paciente, se elige a cuál se vincula. */}
          {form.roles.includes("paciente") && (
            <div className="md:col-span-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-600 mb-1 block">Paciente vinculado</span>
                <select
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Seleccionar paciente…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} · {p.documentId}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="md:col-span-2"><ErrorAlert message={err} /></div>
          <div className="md:col-span-2">
            <PrimaryButton busy={saving} disabled={form.roles.length === 0}>Crear</PrimaryButton>
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
                <th className="text-left px-6 py-3">Nombre</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Roles</th>
                <th className="text-left px-6 py-3">Estado</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 align-top">
                  <td className="px-6 py-3">
                    {u.fullName}
                    {u.id === me?.id && <span className="text-xs text-slate-400 ml-1">(vos)</span>}
                  </td>
                  <td className="px-6 py-3 text-slate-500">{u.email}</td>
                  <td className="px-6 py-3">
                    {editingId === u.id ? (
                      <div className="flex flex-wrap gap-2">
                        {ALL_ROLES.map((role) => (
                          <label key={role} className="flex items-center gap-1 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={editRoles.includes(role)}
                              onChange={() => toggleRole(role, editRoles, setEditRoles)}
                            />
                            {ROLE_LABEL[role]}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span key={r} className="px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700">{ROLE_LABEL[r]}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right space-x-3 whitespace-nowrap">
                    {editingId === u.id ? (
                      <>
                        <button onClick={() => void saveRoles(u.id)} className="text-brand-600 text-xs hover:underline">Guardar</button>
                        <button onClick={() => setEditingId(null)} className="text-slate-500 text-xs hover:underline">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(u.id); setEditRoles(u.roles); }} className="text-brand-600 text-xs hover:underline">Editar roles</button>
                        <button onClick={() => void resetPassword(u.id)} className="text-slate-500 text-xs hover:underline">Resetear pass</button>
                        {/* El backend impide desactivar la propia cuenta. */}
                        {u.id !== me?.id && (
                          <button onClick={() => void toggleActive(u)} className="text-rose-600 text-xs hover:underline">
                            {u.active ? "Desactivar" : "Activar"}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <EmptyRow colSpan={5}>Sin usuarios</EmptyRow>}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}
