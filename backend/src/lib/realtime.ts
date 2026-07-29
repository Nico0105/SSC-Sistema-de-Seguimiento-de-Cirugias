// ======================================================
// Tiempo real (lib/realtime.ts)
// Wrapper mínimo sobre Socket.io para emitir eventos de
// dominio (ej. "surgery:update") desde cualquier ruta sin
// acoplar los controladores al servidor de sockets.
//
// Nota de diseño: la documentación funcional menciona un
// servicio de tiempo real gestionado (Pusher); este módulo
// cumple el mismo requisito con Socket.io autoalojado, sin
// depender de credenciales de terceros. Si en el futuro se
// migra a Pusher, sólo hay que reimplementar `emit`.
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
