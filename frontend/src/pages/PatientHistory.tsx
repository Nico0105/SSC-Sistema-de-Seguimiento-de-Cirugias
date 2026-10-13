// ======================================================
// Historia clínica consolidada (pages/PatientHistory.tsx)
// Vista del staff con todo lo del paciente, en dos columnas:
//   - Lateral: una sola ficha con los datos que importan
//     (edad, DNI, grupo, contacto), las alertas SÓLO si
//     existen (alergias + alertas que deriva el backend) y la
//     medicación vigente.
//   - Principal, en pestañas: cirugías, síntomas, mensajes del
//     médico y emails enviados.
// Todo ordenado cronológicamente (lo más reciente primero).
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { api, getErrorMessage } from "../lib/api-client";
import { SYMPTOM_LABEL, POSTOP_STATUS_LABEL } from "../lib/symptoms";
import { useAuth } from "../lib/auth-context";
import { can } from "../lib/permissions";
import { ageFrom, formatCode, formatDate, formatDateTime } from "../lib/format";
import { cn } from "../lib/cn";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ErrorAlert } from "../components/ui/alert";
import { Loading } from "../components/ui/spinner";
import { StatusBadge } from "../components/ui/status-badge";
import { Breadcrumbs } from "../components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import MessagesPanel from "../components/MessagesPanel";
import type { PatientHistoryData } from "../lib/types";

const EMAIL_STATUS_TEXT: Record<string, string> = {
  enviado: "text-emerald-700",
  fallido: "text-rose-600",
  omitido: "text-slate-400",
};

export default function PatientHistory() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PatientHistoryData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setData(await api.get<PatientHistoryData>(`/api/patients/${id}/history`));
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (err) return <ErrorAlert message={err} />;
  if (!data) return <Loading label="Cargando historia clínica…" />;

  const { patient } = data;
  const age = ageFrom(patient.birthDate);
  const alerts = [...(patient.allergies ? [`Alergia: ${patient.allergies}`] : []), ...data.alerts];

  return (
    <>
      <Breadcrumbs items={[{ label: "Pacientes", to: "/patients" }, { label: "Historia clínica" }]} />

      <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{patient.firstName} {patient.lastName}</h1>
          <p className="mt-2 text-base text-slate-500">
            {age !== null ? `${age} años` : "Edad sin cargar"}
            <span className="mx-2 text-slate-300">·</span>DNI {patient.documentId}
            {patient.bloodType && <><span className="mx-2 text-slate-300">·</span>Grupo {patient.bloodType}</>}
          </p>
        </div>
        <Button variant="ghost" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[300px_1fr]">
        {/* Ficha lateral */}
        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          {/* Alertas: sólo si existen */}
          {alerts.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-slate-500">Alertas</h2>
              <ul className="mt-3 space-y-2">
                {alerts.map((a) => (
                  <li key={a} className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{a}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-sm font-medium text-slate-500">Medicación vigente</h2>
            {data.medication.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Sin medicación indicada.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.medication.map((m) => (
                  <li key={m.procedure}>
                    <p className="text-sm text-slate-900">{m.medication}</p>
                    <p className="text-xs text-slate-400">{m.procedure}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium text-slate-500">Contacto</h2>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p>{patient.phone ?? "Sin teléfono"}</p>
              <p className="break-all">{patient.email ?? "Sin email"}</p>
              {patient.address && <p className="text-slate-500">{patient.address}</p>}
            </div>
          </section>
        </aside>

        {/* Contenido principal */}
        <div className="min-w-0">
          <Tabs defaultValue="cirugias">
            <TabsList variant="underline">
              <TabsTrigger value="cirugias">Cirugías</TabsTrigger>
              <TabsTrigger value="sintomas">Síntomas</TabsTrigger>
              <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
            </TabsList>

            <TabsContent value="cirugias">
              <Card className="p-8">
                {data.surgeries.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin cirugías registradas.</p>
                ) : (
                  <ol className="divide-y divide-slate-100">
                    {data.surgeries.map((s) => {
                      const checked = s.checklistItems.filter((c) => c.checked).length;
                      const total = s.checklistItems.length;
                      const lastControl = s.postopRecords[0];
                      return (
                        <li key={s.id} className="py-6 first:pt-0 last:pb-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <Link to={`/surgeries/${s.id}`} className="font-medium text-slate-900 hover:text-blue-700">
                                {s.procedure}
                              </Link>
                              <p className="mt-1 text-sm text-slate-400">
                                {formatDate(s.scheduledAt)} · <span className="font-mono">{formatCode(s.publicCode)}</span>
                                {s.surgeonName && ` · ${s.surgeonName}`}
                              </p>
                            </div>
                            <StatusBadge status={s.status} waitingRoom={s.waitingRoom} />
                          </div>
                          {(total > 0 || lastControl) && (
                            <p className="mt-3 text-sm text-slate-500">
                              {total > 0 && `Checklist ${checked} de ${total}`}
                              {total > 0 && lastControl && " · "}
                              {lastControl &&
                                `Último control: ${(POSTOP_STATUS_LABEL[lastControl.status] ?? lastControl.status).toLowerCase()}${lastControl.evolution ? ` — ${lastControl.evolution}` : ""}`}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="sintomas">
              <Card className="p-8">
                {data.symptoms.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin reportes de síntomas.</p>
                ) : (
                  <ol className="divide-y divide-slate-100">
                    {data.symptoms.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-3 py-5 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm text-slate-900">{r.symptoms.map((sym) => SYMPTOM_LABEL[sym] ?? sym).join(", ")}</p>
                          {r.notes && <p className="mt-1 text-sm text-slate-500">{r.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className={cn("text-sm", r.painLevel >= 8 ? "text-rose-600" : "text-slate-600")}>Dolor {r.painLevel}/10</p>
                          <p className="text-xs text-slate-400">{formatDateTime(r.reportedAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </TabsContent>

            {/* Mensajes del médico al paciente (le llegan por email) */}
            <TabsContent value="mensajes">
              <MessagesPanel
                endpoint={`/api/patients/${patient.id}/messages`}
                canWrite={can(user?.roles, "mensajes:escribir")}
                patientHasEmail={Boolean(patient.email)}
              />
            </TabsContent>

            <TabsContent value="emails">
              <Card className="p-8">
                {data.emails.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin emails registrados.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.emails.map((e) => (
                      <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4 first:pt-0 last:pb-0">
                        <span className="text-sm text-slate-900">{e.subject}</span>
                        <span className="text-xs text-slate-400">
                          <span className={EMAIL_STATUS_TEXT[e.status] ?? "text-slate-400"}>{e.status}</span> · {formatDateTime(e.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
