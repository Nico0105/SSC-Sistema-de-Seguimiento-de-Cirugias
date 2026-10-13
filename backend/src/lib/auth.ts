// ======================================================
// Utilidades de autenticación (lib/auth.ts)
// Firma y verificación de JWT + hashing de contraseñas
// con bcrypt. Es la única capa que conoce el secreto y
// el algoritmo de hashing: el resto del backend usa
// estas funciones sin tocar detalles criptográficos.
// ======================================================
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

/** Costo de bcrypt: 10 rondas equilibra seguridad y latencia de login. */
const BCRYPT_ROUNDS = 10;

/**
 * Payload que viaja dentro del JWT.
 * `sub` es el id del usuario (convención estándar JWT) y `roles`
 * permite autorizar sin volver a consultar la base en cada request.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

/** Genera un token de sesión firmado, con expiración configurada. */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

/**
 * Verifica firma y expiración de un token.
 * Lanza si el token es inválido o expiró: el middleware de auth
 * traduce ese error a una respuesta 401.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

/** Hashea una contraseña en texto plano (nunca se persiste sin hashear). */
export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Compara una contraseña en texto plano contra el hash almacenado. */
export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
