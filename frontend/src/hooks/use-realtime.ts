// ======================================================
// Hook de tiempo real (hooks/use-realtime.ts)
// Suscribe un callback a los eventos de cirugías emitidos
// por el backend vía Socket.io y lo desuscribe al desmontar.
// Centraliza la lógica que antes estaba copiada y pegada en
// Dashboard, Board, Surgeries y SurgeryDetail.
// ======================================================
import { useEffect, useRef } from "react";
import { getSocket } from "../lib/api-client";

/** Eventos de dominio que emite el backend al cambiar cirugías. */
export const SURGERY_EVENTS = ["surgery:created", "surgery:update", "surgery:deleted"] as const;

/**
 * Ejecuta `onEvent` cada vez que llega alguno de los `events` indicados.
 * El callback se guarda en una ref para no re-suscribir el socket en
 * cada render aunque el caller pase una función nueva cada vez.
 */
export function useRealtime(events: readonly string[], onEvent: () => void) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const socket = getSocket();
    const handler = () => handlerRef.current();
    events.forEach((e) => socket.on(e, handler));
    return () => {
      events.forEach((e) => socket.off(e, handler));
    };
    // `events` es una constante en todos los usos; join evita
    // re-suscripciones si el caller pasa un array literal.
  }, [events.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
}
