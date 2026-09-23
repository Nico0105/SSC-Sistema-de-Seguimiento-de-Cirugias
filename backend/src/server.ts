// ======================================================
// Punto de entrada del backend (server.ts)
// Levanta el servidor HTTP con:
//   - Express (API REST bajo /api/*)
//   - Socket.io (eventos de tiempo real) sobre el mismo puerto
//   - helmet (headers de seguridad HTTP)
//   - CORS restringido a los orígenes configurados
//   - Manejador global de errores y apagado ordenado
// ======================================================
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { setIo } from "./lib/realtime.js";
import { errorHandler } from "./middleware/error.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import patientRoutes from "./routes/patients.js";
import surgeryRoutes from "./routes/surgeries.js";
import roomRoutes from "./routes/operating-rooms.js";
import appointmentRoutes from "./routes/appointments.js";
import publicRoutes from "./routes/public.js";
import checklistRoutes from "./routes/checklists.js";
import symptomRoutes from "./routes/symptoms.js";
import postopRoutes from "./routes/postop.js";
import historyRoutes from "./routes/history.js";
import meRoutes from "./routes/me.js";
import fcmTokenRoutes from "./routes/fcm-tokens.js";
import emailLogRoutes from "./routes/emails.js";
import { startReminderScheduler } from "./lib/scheduler.js";

const app = express();
const httpServer = createServer(app);

// Socket.io comparte el puerto HTTP; mismo control de orígenes que la API.
const io = new SocketServer(httpServer, {
  cors: { origin: env.corsOrigins },
});
setIo(io);

// --- Middlewares globales ---------------------------------------
app.use(helmet());
app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: "1mb" }));

// --- Rutas -------------------------------------------------------
/** Healthcheck para monitoreo/despliegue. */
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/surgeries", surgeryRoutes);
app.use("/api/operating-rooms", roomRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/public", publicRoutes);
// Módulo de cuidado del paciente (checklist, síntomas, seguimiento, historial).
// Estas rutas definen sus paths completos internamente (ej. /surgeries/:id/checklist).
app.use("/api", checklistRoutes);
app.use("/api", symptomRoutes);
app.use("/api", postopRoutes);
app.use("/api", historyRoutes);
app.use("/api", meRoutes);
// Notificaciones push y auditoría de emails.
app.use("/api/fcm-tokens", fcmTokenRoutes);
app.use("/api/email-logs", emailLogRoutes);

/** 404 explícito para rutas de API inexistentes. */
app.use("/api", (_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// El manejador de errores SIEMPRE se registra al final.
app.use(errorHandler);

// --- Tiempo real -------------------------------------------------
io.on("connection", (socket) => {
  console.log("[socket] cliente conectado", socket.id);
  socket.on("disconnect", () => console.log("[socket] desconectado", socket.id));
});

// --- Arranque y apagado ordenado --------------------------------
httpServer.listen(env.port, () => {
  console.log(`SSC backend escuchando en http://localhost:${env.port}`);
  // Recordatorios automáticos de cirugía (48 h / 24 h) por email + push.
  startReminderScheduler();
});

/** Cierra sockets, servidor HTTP y conexiones a la base antes de salir. */
async function shutdown(signal: string) {
  console.log(`[server] ${signal} recibido, cerrando…`);
  io.close();
  httpServer.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
