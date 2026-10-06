-- Roles del sistema:
--   + recepcionista: gestiona pacientes y consulta turnos y estados de cirugía.
--   - familiar: deja de ser un rol; los familiares sólo usan la pantalla
--     pública de cirugías, que no requiere cuenta.
-- PostgreSQL no permite quitar un valor de un enum, así que se recrea el tipo.

-- Una asignación del rol "familiar" no tiene equivalente en el nuevo modelo.
DELETE FROM "UserRole" WHERE "role"::text = 'familiar';

CREATE TYPE "AppRole_new" AS ENUM (
  'admin', 'jefe_quirofano', 'medico', 'enfermero', 'recepcionista', 'administrativo', 'paciente'
);

ALTER TABLE "UserRole" ALTER COLUMN "role" TYPE "AppRole_new" USING ("role"::text::"AppRole_new");

DROP TYPE "AppRole";
ALTER TYPE "AppRole_new" RENAME TO "AppRole";
