import { useEffect, useState } from "react";
import { api, getSocket } from "../lib/api-client";
import { STATUS_LABEL, STATUS_COLOR, type SurgeryStatus } from "../lib/surgery-status";

interface BoardItem {
  id: string;
  publicCode: string;
  status: SurgeryStatus;
  scheduledAt: string;
  operatingRoom: { code: string; name: string } | null;
}

export default function Board() {
  const [items, setItems] = useState<BoardItem[]>([]);

  async function load() {
    setItems(await api.get<BoardItem[]>("/api/public/board"));
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    const refresh = () => load();
    socket.on("surgery:update", refresh);
    socket.on("surgery:created", refresh);
    socket.on("surgery:deleted", refresh);
    const t = setInterval(load, 30_000);
    return () => {
      socket.off("surgery:update", refresh);
      socket.off("surgery:created", refresh);
      socket.off("surgery:deleted", refresh);
      clearInterval(t);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-5xl font-bold">Estado de Cirugías</h1>
          <p className="text-slate-400 mt-2 text-lg">Información en tiempo real para familiares</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono">{new Date().toLocaleTimeString()}</div>
          <div className="text-slate-400">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {items.map((s) => (
          <div key={s.id} className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Código</div>
                <div className="text-4xl font-mono font-bold">{s.publicCode}</div>
              </div>
              <span className={`px-4 py-2 rounded-full text-base font-medium ${STATUS_COLOR[s.status]}`}>
                {STATUS_LABEL[s.status]}
              </span>
            </div>
            <div className="mt-6 flex items-center gap-6 text-slate-300">
              <div>
                <div className="text-xs text-slate-500 uppercase">Quirófano</div>
                <div className="text-xl">{s.operatingRoom?.code ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase">Programada</div>
                <div className="text-xl">{new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-2 text-center text-slate-500 py-20 text-xl">
            No hay cirugías programadas para hoy.
          </div>
        )}
      </div>
    </div>
  );
}
