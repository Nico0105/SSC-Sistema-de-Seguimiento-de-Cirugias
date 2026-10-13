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
import { formatDateTime } from "../lib/format";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ErrorAlert } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import type { PatientMessage } from "../lib/types";

const MAX_LENGTH = 2000;

/** Texto del resultado del envío por email (sólo lo ve el staff). */
const EMAIL_STATUS: Record<string, string> = {
  enviado: "Enviado por email",
  fallido: "No se pudo enviar el email",
  omitido: "Sólo en el sistema (sin email)",
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
      if (saved.emailStatus === "enviado") toast.success("Mensaje enviado");
      else toast.info(`Mensaje guardado. ${EMAIL_STATUS[saved.emailStatus ?? ""] ?? ""}`);
    } catch (error) {
      toast.error(error);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="p-8">
      <h2 className="text-base font-semibold text-slate-900">{canWrite ? "Mensajes al paciente" : "Mensajes de tu médico"}</h2>

      {canWrite && (
        <form onSubmit={send} className="mt-6">
          <label htmlFor="patient-message" className="sr-only">Nuevo mensaje</label>
          <textarea
            id="patient-message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={3}
            placeholder="Escribí una indicación para el paciente…"
            className="w-full resize-y rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              {patientHasEmail ? "Le llega por email." : "El paciente no tiene email: quedará sólo en el sistema."}
            </span>
            <Button type="submit" busy={sending} disabled={!draft.trim()}>Enviar</Button>
          </div>
        </form>
      )}

      <div className="mt-6">
        <ErrorAlert message={err} />
        {!messages ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-400">
            {canWrite ? "Todavía no hay mensajes para este paciente." : "Todavía no tenés mensajes."}
          </p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {messages.map((m) => (
              <li key={m.id} className="py-5 first:pt-0 last:pb-0">
                <p className="text-xs text-slate-400">
                  {m.author?.fullName ?? "Equipo médico"} · {formatDateTime(m.createdAt)}
                  {canWrite && m.emailStatus && ` · ${EMAIL_STATUS[m.emailStatus] ?? m.emailStatus}`}
                </p>
                {/* whitespace-pre-wrap respeta los saltos de línea del médico. */}
                <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-slate-800">{m.body}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
