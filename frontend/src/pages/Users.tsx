// ======================================================
// Usuarios (pages/Users.tsx)
// Página exclusiva del administrador:
//   - Tabla con nombre, email, roles y estado (sólo se destaca
//     una cuenta inactiva); acciones en un menú "⋯": editar
//     roles, resetear contraseña, activar / desactivar.
//   - Alta de usuarios en panel lateral, con vínculo a un
//     paciente cuando la cuenta tiene rol "paciente".
// El backend impide que un admin se desactive o se quite su
// propio rol; acá se refleja el error si ocurre.
// ======================================================
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { api, getErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { ROLE_LABEL, can, type Role } from "../lib/permissions";
import { toast } from "../lib/toast";
import { cn } from "../lib/cn";
import { usePatientsQuery } from "../hooks/use-catalog-queries";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DataTable } from "../components/ui/data-table";
import { ErrorAlert } from "../components/ui/alert";
import { PageHeader } from "../components/ui/page-header";
import { Sheet, SheetContent } from "../components/ui/sheet";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import type { AppUser } from "../lib/types";

const USERS_QUERY_KEY = ["users"] as const;
const ALL_ROLES = Object.keys(ROLE_LABEL) as Role[];
const EMPTY_FORM = { email: "", password: "", fullName: "", roles: [] as Role[], patientId: "" };
const FORM_ID = "new-user-form";

export default function Users() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => api.get<AppUser[]>("/api/users"),
  });
  // Los pacientes se cargan para poder vincular cuentas con rol "paciente".
  const { data: patients = [] } = usePatientsQuery();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const [rolesFor, setRolesFor] = useState<AppUser | null>(null);
  const [editRoles, setEditRoles] = useState<Role[]>([]);
  const [passwordFor, setPasswordFor] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [activeFor, setActiveFor] = useState<AppUser | null>(null);
  const [busy, setBusy] = useState(false);


  // Doble protección: la ruta también está restringida en el backend.
  if (!can(me?.roles, "usuarios:gestionar")) return <Navigate to="/dashboard" replace />;

  const refresh = () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });

  /** Agrega o quita un rol de una lista (checkboxes). */
  function toggleRole(role: Role, roles: Role[]): Role[] {
    return roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (form.roles.length === 0) {
      setFormErr("Asigná al menos un rol");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/users", {
        ...form,
        // El vínculo con un paciente sólo aplica a cuentas con ese rol.
        patientId: form.roles.includes("paciente") && form.patientId ? form.patientId : null,
      });
      await refresh();
      toast.success(`Usuario ${form.fullName} creado`);
      setForm(EMPTY_FORM);
      setSheetOpen(false);
    } catch (error) {
      setFormErr(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function saveRoles() {
    if (!rolesFor) return;
    if (editRoles.length === 0) {
      toast.error(new Error("Asigná al menos un rol"));
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/api/users/${rolesFor.id}`, { roles: editRoles });
      await refresh();
      toast.success("Roles actualizados");
      setRolesFor(null);
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  async function savePassword() {
    if (!passwordFor) return;
    if (newPassword.length < 8) {
      toast.error(new Error("La contraseña debe tener al menos 8 caracteres"));
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/api/users/${passwordFor.id}/password`, { password: newPassword });
      toast.success(`Contraseña de ${passwordFor.fullName} actualizada`);
      setPasswordFor(null);
      setNewPassword("");
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    if (!activeFor) return;
    setBusy(true);
    try {
      await api.patch(`/api/users/${activeFor.id}`, { active: !activeFor.active });
      await refresh();
      toast.success(activeFor.active ? "Usuario desactivado" : "Usuario reactivado");
      setActiveFor(null);
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  }

  const columns: ColumnDef<AppUser, any>[] = [
    {
      id: "user",
      accessorFn: (u) => `${u.fullName} ${u.email}`,
      header: "Usuario",
      cell: (ctx) => {
        const u = ctx.row.original;
        return (
          <div className="min-w-[200px]">
            <p className="text-slate-900">
              {u.fullName}
              {u.id === me?.id && <span className="ml-2 text-xs text-slate-400">(vos)</span>}
            </p>
            <p className="text-xs text-slate-400">{u.email}</p>
          </div>
        );
      },
    },
    {
      id: "roles",
      accessorFn: (u) => u.roles.map((r) => ROLE_LABEL[r as Role] ?? r).join(", "),
      header: "Roles",
      cell: (ctx) => <span className="text-slate-600">{ctx.getValue() as string}</span>,
    },
    {
      id: "status",
      accessorFn: (u) => (u.active ? "Activo" : "Inactivo"),
      header: "Estado",
      cell: (ctx) =>
        ctx.row.original.active ? (
          <span className="text-sm text-slate-500">Activo</span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">Inactivo</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: (ctx) => {
        const u = ctx.row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600" aria-label={`Acciones para ${u.fullName}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => { setRolesFor(u); setEditRoles(u.roles as Role[]); }}>
                  Editar roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setPasswordFor(u); setNewPassword(""); }}>
                  Resetear contraseña
                </DropdownMenuItem>
                {/* El backend impide desactivar la propia cuenta. */}
                {u.id !== me?.id && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive={u.active} onClick={() => setActiveFor(u)}>
                      {u.active ? "Desactivar" : "Reactivar"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        description={`${users.filter((u) => u.active).length} cuentas activas`}
        actions={
          <Button onClick={() => { setFormErr(null); setForm(EMPTY_FORM); setSheetOpen(true); }}>
            <UserPlus className="h-4 w-4" /> Nuevo usuario
          </Button>
        }
      />

      {error && <div className="mb-8"><ErrorAlert message={getErrorMessage(error)} /></div>}

      <Card>
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          searchPlaceholder="Buscar"
          emptyMessage="Sin usuarios"
        />
      </Card>

      {/* Alta de usuario */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          title="Nuevo usuario"
          description="Las cuentas sólo las crea un administrador."
          footer={
            <>
              <Button variant="ghost" onClick={() => setSheetOpen(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" form={FORM_ID} busy={saving}>Crear usuario</Button>
            </>
          }
        >
          <form id={FORM_ID} onSubmit={submit} className="space-y-6">
            <Input label="Nombre completo" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Input label="Contraseña inicial" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required minLength={8} placeholder="Mínimo 8 caracteres" />
            <RolePicker roles={form.roles} onToggle={(r) => setForm({ ...form, roles: toggleRole(r, form.roles) })} />
            {/* Cuando la cuenta es de un paciente, se elige a cuál se vincula. */}
            {form.roles.includes("paciente") && (
              <Select label="Paciente vinculado" value={form.patientId} onChange={(v) => setForm({ ...form, patientId: v })} required>
                <option value="">Seleccionar paciente…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} · {p.documentId}</option>
                ))}
              </Select>
            )}
            <ErrorAlert message={formErr} />
          </form>
        </SheetContent>
      </Sheet>

      {/* Editar roles */}
      <ConfirmDialog
        open={rolesFor !== null}
        onOpenChange={(o) => !o && setRolesFor(null)}
        title={`Roles de ${rolesFor?.fullName ?? ""}`}
        description="Los permisos de cada pantalla dependen de estos roles."
        confirmLabel="Guardar roles"
        busy={busy}
        onConfirm={() => void saveRoles()}
      >
        <RolePicker roles={editRoles} onToggle={(r) => setEditRoles(toggleRole(r, editRoles))} />
      </ConfirmDialog>

      {/* Resetear contraseña */}
      <ConfirmDialog
        open={passwordFor !== null}
        onOpenChange={(o) => !o && setPasswordFor(null)}
        title="Resetear contraseña"
        description={`Definí una nueva contraseña para ${passwordFor?.fullName ?? ""}. Comunicásela por un canal seguro.`}
        confirmLabel="Actualizar contraseña"
        busy={busy}
        onConfirm={() => void savePassword()}
      >
        <Input label="Nueva contraseña" type="password" value={newPassword} onChange={setNewPassword} minLength={8} placeholder="Mínimo 8 caracteres" />
      </ConfirmDialog>

      {/* Activar / desactivar */}
      <ConfirmDialog
        open={activeFor !== null}
        onOpenChange={(o) => !o && setActiveFor(null)}
        title={activeFor?.active ? "¿Desactivar usuario?" : "¿Reactivar usuario?"}
        description={
          activeFor?.active
            ? `${activeFor.fullName} no podrá iniciar sesión y su sesión actual se cerrará.`
            : `${activeFor?.fullName ?? ""} podrá volver a iniciar sesión.`
        }
        confirmLabel={activeFor?.active ? "Desactivar" : "Reactivar"}
        variant={activeFor?.active ? "destructive" : "default"}
        busy={busy}
        onConfirm={() => void toggleActive()}
      />
    </>
  );
}

/** Selector de roles con casillas en grilla. */
function RolePicker({ roles, onToggle }: { roles: Role[]; onToggle: (role: Role) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-slate-700">Roles</legend>
      <div className="grid grid-cols-2 gap-2">
        {ALL_ROLES.map((role) => {
          const checked = roles.includes(role);
          return (
            <label
              key={role}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
                checked ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <input type="checkbox" checked={checked} onChange={() => onToggle(role)} className="h-4 w-4 accent-navy-600" />
              {ROLE_LABEL[role]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
