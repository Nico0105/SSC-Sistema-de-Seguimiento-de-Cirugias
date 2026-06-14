import type { Server as SocketServer } from "socket.io";

let ioRef: SocketServer | null = null;

export function setIo(io: SocketServer) {
  ioRef = io;
}

export function emit(event: string, payload: unknown) {
  ioRef?.emit(event, payload);
}
