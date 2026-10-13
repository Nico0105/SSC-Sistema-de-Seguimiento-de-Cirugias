-- Código público autoincremental de cirugías ("MQ-0001", "MQ-0002", ...).
-- La secuencia de PostgreSQL garantiza números únicos aunque dos usuarios
-- programen cirugías al mismo tiempo. Arranca después del número más alto
-- ya usado con el formato "MQ-<número>", para no chocar con datos existentes.
CREATE SEQUENCE IF NOT EXISTS "surgery_public_code_seq" START 1;

SELECT setval(
  '"surgery_public_code_seq"',
  COALESCE(
    (SELECT MAX(CAST(SUBSTRING("publicCode" FROM 4) AS INTEGER))
       FROM "Surgery"
      WHERE "publicCode" ~ '^MQ-[0-9]+$'),
    0
  ) + 1,
  false
);
