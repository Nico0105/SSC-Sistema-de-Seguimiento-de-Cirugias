// ======================================================
// useSocketStatus (hooks/use-socket-status.ts)
// Estado REAL de la conexión de tiempo real (Socket.IO) y
// hora del último evento recibido. Alimenta los indicadores
// "Sistema sincronizado / Sin conexión" del encabezado, la
// barra de estado inferior y la pantalla pública.
// ======================================================
import { useEffect, useState } from "react";
import { getSocket } from "../lib/api-client";
import { SURGERY_EVENTS } from "./use-realtime";

export interface SocketStatus {
  connected: boolean;
  /** Último evento de cirugía recibido (o momento de la conexión). */
  lastSyncAt: Date | null;
}

export function useSocketStatus(): SocketStatus {
  const [status, setStatus] = useState<SocketStatus>(() => ({
    connected: getSocket().connected,
    lastSyncAt: getSocket().connected ? new Date() : null,
  }));

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setStatus({ connected: true, lastSyncAt: new Date() });
    const onDisconnect = () => setStatus((s) => ({ ...s, connected: false }));
    const onEvent = () => setStatus({ connected: true, lastSyncAt: new Date() });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    SURGERY_EVENTS.forEach((e) => socket.on(e, onEvent));
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      SURGERY_EVENTS.forEach((e) => socket.off(e, onEvent));
    };
  }, []);

  return status;
}
