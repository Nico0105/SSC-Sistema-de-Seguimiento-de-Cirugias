import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

import { setIo } from "./lib/realtime.js";
import { errorHandler } from "./middleware/error.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import patientRoutes from "./routes/patients.js";
import surgeryRoutes from "./routes/surgeries.js";
import roomRoutes from "./routes/operating-rooms.js";
import appointmentRoutes from "./routes/appointments.js";
import publicRoutes from "./routes/public.js";

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN?.split(",") ?? "*" },
});
setIo(io);

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/surgeries", surgeryRoutes);
app.use("/api/operating-rooms", roomRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/public", publicRoutes);

app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("[socket] cliente conectado", socket.id);
  socket.on("disconnect", () => console.log("[socket] desconectado", socket.id));
});

const PORT = Number(process.env.PORT ?? 4000);
httpServer.listen(PORT, () => {
  console.log(`SSC backend escuchando en http://localhost:${PORT}`);
});
