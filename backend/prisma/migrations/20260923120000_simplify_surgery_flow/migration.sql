-- Nuevo flujo de estados de cirugía:
--   programada → en_quirofano → esperando_en_sala → postoperatorio → alta
-- Remapeo de datos existentes (sin pérdida de filas):
--   ingreso, preoperatorio → programada   (todavía no entraron a quirófano)
--   recuperacion           → esperando_en_sala

-- Número de sala de espera post-quirófano.
ALTER TABLE "Surgery" ADD COLUMN "waitingRoom" TEXT;

-- Nuevo tipo enum.
CREATE TYPE "SurgeryStatus_new" AS ENUM (
  'programada', 'en_quirofano', 'esperando_en_sala', 'postoperatorio', 'alta', 'cancelada'
);

-- Surgery.status (se quita el default para poder cambiar el tipo).
ALTER TABLE "Surgery" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Surgery" ALTER COLUMN "status" TYPE "SurgeryStatus_new" USING (
  CASE "status"::text
    WHEN 'ingreso' THEN 'programada'
    WHEN 'preoperatorio' THEN 'programada'
    WHEN 'recuperacion' THEN 'esperando_en_sala'
    ELSE "status"::text
  END
)::"SurgeryStatus_new";
ALTER TABLE "Surgery" ALTER COLUMN "status" SET DEFAULT 'programada';

-- SurgeryStatusHistory.status
ALTER TABLE "SurgeryStatusHistory" ALTER COLUMN "status" TYPE "SurgeryStatus_new" USING (
  CASE "status"::text
    WHEN 'ingreso' THEN 'programada'
    WHEN 'preoperatorio' THEN 'programada'
    WHEN 'recuperacion' THEN 'esperando_en_sala'
    ELSE "status"::text
  END
)::"SurgeryStatus_new";

-- Reemplazo del tipo viejo.
DROP TYPE "SurgeryStatus";
ALTER TYPE "SurgeryStatus_new" RENAME TO "SurgeryStatus";
