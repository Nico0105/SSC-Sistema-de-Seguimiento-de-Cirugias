// ======================================================
// Seed de datos iniciales (prisma/seed.ts)
// Crea los datos mínimos para poder usar el sistema:
//   - Usuario administrador (admin@ssc.local / Admin123!)
//   - Dos quirófanos de ejemplo (Q1 y Q2)
//   - Ítems por defecto del checklist preoperatorio
// Es idempotente: usa upsert, por lo que puede ejecutarse
// varias veces sin duplicar registros.
//   Ejecutar con: npm run seed
// ======================================================
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ssc.local" },
    update: {},
    create: {
      email: "admin@ssc.local",
      passwordHash,
      fullName: "Administrador SSC",
      roles: { create: { role: "admin" } },
    },
  });

  await prisma.operatingRoom.upsert({
    where: { code: "Q1" },
    update: {},
    create: { code: "Q1", name: "Quirófano 1", floor: "PB" },
  });
  await prisma.operatingRoom.upsert({
    where: { code: "Q2" },
    update: {},
    create: { code: "Q2", name: "Quirófano 2", floor: "PB" },
  });

  // Checklist preoperatorio por defecto (configurable luego desde la API).
  // Sólo se crea si la tabla está vacía, para no duplicar ni pisar cambios.
  const templateCount = await prisma.checklistTemplate.count();
  if (templateCount === 0) {
    await prisma.checklistTemplate.createMany({
      data: [
        { label: "Ayuno realizado", order: 1 },
        { label: "Estudios entregados", order: 2 },
        { label: "Consentimiento firmado", order: 3 },
        { label: "Medicación suspendida", order: 4 },
        { label: "Higiene realizada", order: 5 },
        { label: "Acompañante confirmado", order: 6 },
      ],
    });
    console.log("Checklist preoperatorio por defecto creado (6 ítems).");
  }

  console.log("Seed completo. Login: admin@ssc.local / Admin123!");
  console.log("Admin id:", admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
