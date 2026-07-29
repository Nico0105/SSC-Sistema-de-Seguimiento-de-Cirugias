// ======================================================
// Tiempo real (lib/realtime.ts)
// Wrapper mínimo sobre Socket.IO para emitir eventos de
// dominio (ej. "surgery:update") desde cualquier ruta sin
// acoplar los controladores al servidor de sockets.
// Socket.IO es el ÚNICO canal de tiempo real del sistema;
// las notificaciones push van por Firebase Cloud Messaging
// (lib/fcm.ts) y los emails por Resend (lib/email.ts).
// ======================================================
import type { Server as SocketServer } from "socket.io";

let ioRef: SocketServer | null = null;

/** Registra la instancia de Socket.io creada en server.ts. */
export function setIo(io: SocketServer) {
  ioRef = io;
}

/**
 * Emite un evento a TODOS los clientes conectados (panel interno
 * y pantalla pública). El payload nunca debe incluir datos
 * sensibles del paciente porque la pantalla pública también lo recibe.
 */
export function emit(event: string, payload: unknown) {
  ioRef?.emit(event, payload);
}
