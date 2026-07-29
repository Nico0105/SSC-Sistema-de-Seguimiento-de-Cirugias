// ======================================================
// Manejador global de errores (middleware/error.ts)
// Traduce cada tipo de error a un código HTTP coherente:
//   - ZodError            → 400 (payload inválido)
//   - Prisma P2002        → 409 (violación de unicidad)
//   - Prisma P2025        → 404 (registro inexistente)
//   - Prisma P2003        → 409 (violación de clave foránea)
//   - HttpError           → status definido por la ruta
//   - resto               → 500 SIN filtrar detalles internos
// El detalle real siempre queda en el log del servidor.
// ======================================================
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/**
 * Error de negocio con código HTTP explícito.
 * Permite a las rutas cortar el flujo con `throw new HttpError(409, "...")`
 * y que este middleware arme la respuesta.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Datos de entrada que no pasaron la validación de Zod.
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Datos inválidos", details: err.flatten() });
  }

  // Errores de negocio lanzados explícitamente por las rutas.
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Errores conocidos de Prisma → códigos HTTP semánticos.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const fields = Array.isArray(err.meta?.target) ? (err.meta.target as string[]).join(", ") : "campo único";
        return res.status(409).json({ error: `Ya existe un registro con ese valor (${fields})` });
      }
      case "P2025":
        return res.status(404).json({ error: "El registro no existe" });
      case "P2003":
        return res.status(409).json({ error: "La operación viola una referencia a otro registro" });
    }
  }

  // Error inesperado: se loguea completo en el servidor pero al
  // cliente sólo llega un mensaje genérico (no filtrar internals).
  console.error("[error] no controlado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
}
