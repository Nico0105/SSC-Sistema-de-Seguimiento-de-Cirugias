// ======================================================
// Mensajes del médico (components/MessagesPanel.tsx)
// Hilo individual entre el médico y UN paciente, donde sólo
// escribe el equipo médico. Se usa en dos lugares:
//   - Historia del paciente (staff): lista + formulario para
//     dejar un mensaje, que le llega al paciente por email.
//   - Portal del paciente: sólo lectura (endpoint /api/me/messages).
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../lib/api-client";
import { toast } from "../lib/toast";
import { Button } from "./ui/button";
import { ErrorAlert } from "./ui/alert";
import { Loading } from "./ui/spinner";
import type { PatientMessage } from "../lib/types";

const MAX_LENGTH = 2000;

/** Texto y color del resultado del envío por email. */
const EMAIL_STATUS: Record<string, { label: string; className: string }> = {
  enviado: { label: "Enviado por email", className: "text-emerald-700" },
  fallido: { label: "No se pudo enviar el email", className: "text-rose-600" },
  omitido: { label: "Sin email: el paciente no tiene uno cargado", className: "text-slate-500" },
};

export default function MessagesPanel({
  endpoint,
  canWrite,
  patientHasEmail = true,
}: {
  /** /api/patients/:id/messages (staff) o /api/me/messages (paciente). */
  endpoint: string;
  /** Muestra el formulario para escribir (médico/admin). */
  canWrite: boolean;
  /** Si es false, avisa antes de escribir que el mensaje no saldrá por email. */
  patientHasEmail?: boolean;
}) {
  const [messages, setMessages] = useState<PatientMessage[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setMessages(await api.get<PatientMessage[]>(endpoint));
    } catch (error) {
      setErr(getErrorMessage(error));
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  /** Guarda el mensaje; el backend lo envía por email y devuelve el resultado. */
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const saved = await api.post<PatientMessage>(endpoint, { body: draft });
      setMessages((prev) => [saved, ...(prev ?? [])]);
      setDraft("");
      if (saved.emailStatus === "enviado") toast.success("Mensaje guardado y enviado por email");
      else toast.info(`Mensaje guardado. ${EMAIL_STATUS[saved.emailStatus ?? ""]?.label ?? ""}`);
    } catch (error) {
      toast.error(error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
      <h2 className="font-semibold text-slate-800 mb-1">
        {canWrite ? "Mensajes al paciente" : "Mensajes de tu médico"}
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        {canWrite
          ? "Cada mensaje se guarda en este hilo y le llega al paciente por email."
          : "Indicaciones y comentarios que te dejó tu equipo médico."}
      </p>

      {canWrite && (
        <form onSubmit={send} className="mb-5">
          <label htmlFor="patient-message" className="sr-only">Nuevo mensaje</label>
          <textarea
            id="patient-message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={3}
            placeholder="Escribí una indicación o comentario para el paciente…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-y"
          />
          <div className="flex items-center justify-between gap-3 mt-2">
            <span className="text-xs text-slate-400">
              {!patientHasEmail && (
                <span className="text-amber-700">El paciente no tiene email cargado: el mensaje sólo quedará en el sistema. </span>
              )}
              {draft.length}/{MAX_LENGTH}
            </span>
            <Button type="submit" busy={sending} disabled={!draft.trim()}>
              Enviar mensaje
            </Button>
          </div>
        </form>
      )}

      <ErrorAlert message={err} />

      {!messages ? (
        <Loading label="Cargando mensajes…" />
      ) : messages.length === 0 ? (
        <p className="text-sm text-slate-400">
          {canWrite ? "Todavía no le dejaste mensajes a este paciente." : "Todavía no tenés mensajes."}
        </p>
      ) : (
        <ol className="space-y-4">
          {messages.map((m) => {
            const status = m.emailStatus ? EMAIL_STATUS[m.emailStatus] : null;
            return (
              <li key={m.id} className="border-l-2 border-brand-200 pl-4">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-medium text-slate-700">{m.author?.fullName ?? "Equipo médico"}</span>
                  <span className="text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
                  {canWrite && status && <span className={`ml-auto ${status.className}`}>{status.label}</span>}
                </div>
                {/* whitespace-pre-wrap respeta los saltos de línea del médico. */}
                <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap break-words">{m.body}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
