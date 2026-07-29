// ======================================================
// Tipos de Vite (vite-env.d.ts)
// Habilita el tipado de import.meta.env y declara las
// variables de entorno propias del proyecto.
// ======================================================
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend (ej.: http://localhost:4000). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
