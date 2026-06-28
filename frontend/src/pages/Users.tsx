import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { ADMIN_ROLES, ROLE_LABEL, hasAnyRole, type Role } from "../lib/permissions";

interface AppUser {
  id: string;
  email: string;
  fullName: string;
  active: boolean;
  roles: Role[];
}

const ALL_ROLES = Object.keys(ROLE_LABEL) as Role[];

export default function Users() {
  const { user: me } = useAuth();
  const [list, setList] = useState<AppUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", roles: [] as Role[] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<Role[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setList(await api.get<AppUser[]>("/api/users"));
  }
  useEffect(() => { load(); }, []);

  if (!hasAnyRole(me?.roles, ADMIN_ROLES)) return <Navigate to="/dashboard" replace />;

  function toggleRole(role: Role, roles: Role[], setRoles: (r: Role[]) => void) {
    setRoles(roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    try {
      await api.post("/api/users", form);
      setForm({ email: "", password: "", fullName: "", roles: [] });
      setShowForm(false);
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function saveRoles(id: string) {
    try {
      await api.patch(`/api/users/${id}`, { roles: editRoles });
      setEditingId(null);
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function toggleActive(u: AppUser) {
    await api.patch(`/api/users/${u.id}`, { active: !u.active });
    load();
  }

  async function resetPassword(id: string) {
    const password = window.prompt("Nueva contraseña (mínimo 8 caracteres):");
    if (!password) return;
    if (password.length < 8) { alert("Mínimo 8 caracteres"); return; }
    await api.patch(`/api/users/${id}/password`, { password });
    alert("Contraseña actualizada");
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showForm ? "Cancelar" : "+ Nuevo usuario"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre completo</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Contraseña inicial</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Roles</label>
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
          {err && <div className="col-span-2 text-rose-600 text-sm">{err}</div>}
          <div className="col-span-2">
            <button disabled={form.roles.length === 0} className="bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm">Crear</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
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
                <td className="px-6 py-3">{u.fullName}</td>
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
                      <button onClick={() => saveRoles(u.id)} className="text-brand-600 text-xs hover:underline">Guardar</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 text-xs hover:underline">Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(u.id); setEditRoles(u.roles); }} className="text-brand-600 text-xs hover:underline">Editar roles</button>
                      <button onClick={() => resetPassword(u.id)} className="text-slate-500 text-xs hover:underline">Resetear pass</button>
                      <button onClick={() => toggleActive(u)} className="text-rose-600 text-xs hover:underline">
                        {u.active ? "Desactivar" : "Activar"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Sin usuarios</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
