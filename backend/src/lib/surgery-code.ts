// ======================================================
// Código público de cirugías (lib/surgery-code.ts)
// Genera el código de seguimiento que ven los familiares en
// la pantalla de espera: las 3 primeras letras del
// procedimiento + un número correlativo POR TIPO de cirugía.
//   "Cataratas"               → CAT-01, CAT-02, ...
//   "Artroscopia de rodilla"  → ART-01, ART-02, ...
// El número sale de la tabla SurgeryCodeCounter: un upsert
// atómico de PostgreSQL incrementa el contador del prefijo,
// así nunca se repite aunque haya altas simultáneas.
// ======================================================
import { prisma } from "./prisma.js";

/** Mínimo de dígitos del número (01, 02 ... 99, 100 ...). */
const DIGITS = 2;

/**
 * Prefijo de 3 letras a partir del nombre del procedimiento: sin tildes,
 * en mayúsculas y salteando espacios, números y signos.
 * Si el nombre tiene menos de 3 letras, se completa con "X".
 */
export function codePrefix(procedure: string): string {
  const letters = procedure
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return letters.slice(0, 3).padEnd(3, "X");
}

/** Reserva el próximo número del prefijo y arma el código ("CAT-03"). */
export async function nextSurgeryCode(procedure: string): Promise<string> {
  const prefix = codePrefix(procedure);
  const [row] = await prisma.$queryRaw<{ last: number }[]>`
    INSERT INTO "SurgeryCodeCounter" ("prefix", "last") VALUES (${prefix}, 1)
    ON CONFLICT ("prefix") DO UPDATE SET "last" = "SurgeryCodeCounter"."last" + 1
    RETURNING "last"`;
  return `${prefix}-${String(row!.last).padStart(DIGITS, "0")}`;
}
