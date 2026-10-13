// ======================================================
// Cliente de Prisma (lib/prisma.ts)
// Instancia única (singleton) del cliente de base de datos,
// compartida por todo el backend para reutilizar el pool
// de conexiones de PostgreSQL.
// ======================================================
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

export const prisma = new PrismaClient({
  // En desarrollo se loguean también warnings para detectar problemas temprano.
  log: env.isProduction ? ["error"] : ["error", "warn"],
});
