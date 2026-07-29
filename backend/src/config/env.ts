// ======================================================
// Configuración de entorno (config/env.ts)
// Centraliza y valida todas las variables de entorno en
// un único punto. Si falta una variable crítica, la app
// falla al arrancar (fail-fast) en lugar de correr con
// valores inseguros.
// ======================================================

const isProduction = process.env.NODE_ENV === "production";

/**
 * Resuelve el secreto usado para firmar/verificar los JWT.
 * - En producción es OBLIGATORIO definir `JWT_SECRET`.
 * - En desarrollo se permite un valor por defecto, pero se
 *   advierte por consola para que no pase desapercibido.
 */
function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (isProduction) {
    throw new Error(
      "JWT_SECRET no está definido (o es demasiado corto). " +
        "Definí una cadena aleatoria de al menos 32 caracteres en el .env.",
    );
  }
  console.warn(
    "[env] ADVERTENCIA: JWT_SECRET no definido. Usando secreto de desarrollo. " +
      "NO usar esta configuración en producción.",
  );
  return "dev-secret-change-me";
}

/**
 * Orígenes permitidos para CORS (HTTP y WebSocket).
 * Se define como lista separada por comas en `CORS_ORIGIN`.
 * Por defecto sólo se permite el frontend local; nunca "*".
 */
function resolveCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return ["http://localhost:3000"];
  return raw.split(",").map((origin) => origin.trim()).filter(Boolean);
}

export const env = {
  isProduction,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(),
  /** Duración del token de sesión. */
  jwtExpiresIn: "7d",
  corsOrigins: resolveCorsOrigins(),
} as const;
