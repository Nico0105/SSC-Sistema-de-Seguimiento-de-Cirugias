// ======================================================
// Seed de datos iniciales (prisma/seed.ts)
// Crea los datos mínimos para poder usar el sistema:
//   - Usuario administrador (admin@ssc.local / Admin123!)
//   - Dos quirófanos de ejemplo (Q1 y Q2)
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

  console.log("Seed completo. Login: admin@ssc.local / Admin123!");
  console.log("Admin id:", admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
