-- Códigos públicos por tipo de cirugía ("CAT-01", "ART-01", ...).
-- Reemplaza a la secuencia única "surgery_public_code_seq" ("MQ-0001"):
-- ahora cada prefijo (3 primeras letras del procedimiento) tiene su
-- propio contador, que se incrementa de forma atómica con un upsert.
CREATE TABLE "SurgeryCodeCounter" (
    "prefix" TEXT NOT NULL,
    "last" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SurgeryCodeCounter_pkey" PRIMARY KEY ("prefix")
);

-- Los contadores arrancan después de los códigos con este formato que ya existan.
INSERT INTO "SurgeryCodeCounter" ("prefix", "last")
SELECT SUBSTRING("publicCode" FROM 1 FOR 3), MAX(CAST(SUBSTRING("publicCode" FROM 5) AS INTEGER))
FROM "Surgery"
WHERE "publicCode" ~ '^[A-Z]{3}-[0-9]+$'
GROUP BY SUBSTRING("publicCode" FROM 1 FOR 3);

DROP SEQUENCE IF EXISTS "surgery_public_code_seq";
