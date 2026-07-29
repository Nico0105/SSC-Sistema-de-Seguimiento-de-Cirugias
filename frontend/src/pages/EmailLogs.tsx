// ======================================================
// Auditoría de emails (pages/EmailLogs.tsx)
// Listado de los correos que el sistema envió (o intentó
// enviar) vía Resend: confirmaciones, reprogramaciones,
// recordatorios 48/24 h, indicaciones y altas. Permite al
// personal ABM verificar qué recibió cada paciente.
// ======================================================
import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../lib/api-client";
import { EmptyRow, ErrorAlert, Loading, TableCard } from "../components/ui";
import type { EmailLog } from "../lib/types";

/** Etiquetas legibles de cada tipo de email. */
const TYPE_LABEL: Record<string, string> = {
  confirmacion_cirugia: "Confirmación de cirugía",
  reprogramacion_cirugia: "Cambio de fecha/horario",
  recordatorio_48h: "Recordatorio 48 h",
  recordatorio_24h: "Recordatorio 24 h",
  indicaciones_preoperatorias: "Indicaciones preoperatorias",
  alta_medica: "Alta médica",
  confirmacion_control: "Confirmación de turno",
};

const STATUS_COLOR: Record<string, string> = {
  enviado: "bg-emerald-100 text-emerald-700",
  fallido: "bg-rose-100 text-rose-700",
  omitido: "bg-slate-100 text-slate-600",
};

export default function EmailLogs() {
  const [list, setList] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      setList(await api.get<EmailLog[]>("/api/email-logs"));
    } catch (error) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Emails enviados</h1>
      <p className="text-sm text-slate-500 mb-6">
        Correos automáticos del sistema (Resend). "Omitido" indica que faltaba la API key
        o que el paciente no tiene email cargado.
      </p>

      <div className="mb-4"><ErrorAlert message={err} /></div>

      <TableCard>
        {loading ? (
          <Loading />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-6 py-3">Fecha</th>
                <th className="text-left px-6 py-3">Destinatario</th>
                <th className="text-left px-6 py-3">Tipo</th>
                <th className="text-left px-6 py-3">Cirugía</th>
                <th className="text-left px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-3">{e.to}</td>
                  <td className="px-6 py-3">{TYPE_LABEL[e.type] ?? e.type}</td>
                  <td className="px-6 py-3 font-mono text-xs">{e.surgery?.publicCode ?? "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[e.status] ?? ""}`} title={e.error ?? undefined}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <EmptyRow colSpan={5}>Sin emails registrados</EmptyRow>}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}
