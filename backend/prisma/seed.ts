// ======================================================
// Seed de datos iniciales (prisma/seed.ts)
// Crea lo necesario para usar y probar MediQ's:
//   - Un usuario por rol (credenciales en CREDENCIALES.md)
//   - Un paciente de prueba vinculado al usuario "paciente",
//     con una cirugía programada para mañana
//   - Dos quirófanos de ejemplo (Q1 y Q2)
//   - Ítems por defecto del checklist preoperatorio
// Es idempotente: puede ejecutarse varias veces sin duplicar
// registros ni pisar cambios hechos desde la aplicación.
//   Ejecutar con: npm run seed
// ======================================================
import "dotenv/config";
import { PrismaClient, type AppRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Un usuario de prueba por rol. Mantener sincronizado con CREDENCIALES.md. */
const DEMO_USERS: { email: string; password: string; fullName: string; role: AppRole }[] = [
  { email: "admin@mediqus.local", password: "Admin123!", fullName: "Administración MediQ's", role: "admin" },
  { email: "jefe@mediqus.local", password: "Jefe123!", fullName: "Laura Gómez (Jefa de quirófano)", role: "jefe_quirofano" },
  { email: "medico@mediqus.local", password: "Medico123!", fullName: "Dr. Martín Ruiz", role: "medico" },
  { email: "enfermero@mediqus.local", password: "Enfermero123!", fullName: "Sofía Díaz (Enfermería)", role: "enfermero" },
  { email: "recepcion@mediqus.local", password: "Recepcion123!", fullName: "Carla Fernández (Recepción)", role: "recepcionista" },
  { email: "administrativo@mediqus.local", password: "Administrativo123!", fullName: "Pablo Sosa (Administración)", role: "administrativo" },
  { email: "paciente@mediqus.local", password: "Paciente123!", fullName: "Juan Pérez", role: "paciente" },
];

/** Crea el usuario si no existe. No modifica usuarios ya existentes. */
async function upsertUser(u: (typeof DEMO_USERS)[number]) {
  return prisma.user.upsert({
    where: { email: u.email },
    update: {},
    create: {
      email: u.email,
      fullName: u.fullName,
      passwordHash: await bcrypt.hash(u.password, 10),
      roles: { create: { role: u.role } },
    },
  });
}

async function main() {
  const users = new Map<AppRole, { id: string }>();
  for (const u of DEMO_USERS) {
    users.set(u.role, await upsertUser(u));
  }

  const q1 = await prisma.operatingRoom.upsert({
    where: { code: "Q1" },
    update: {},
    create: { code: "Q1", name: "Quirófano 1", floor: "PB" },
  });
  await prisma.operatingRoom.upsert({
    where: { code: "Q2" },
    update: {},
    create: { code: "Q2", name: "Quirófano 2", floor: "PB" },
  });

  // Paciente de prueba vinculado a la cuenta con rol "paciente".
  const patient = await prisma.patient.upsert({
    where: { documentId: "30111222" },
    update: {},
    create: {
      firstName: "Juan",
      lastName: "Pérez",
      documentId: "30111222",
      email: "paciente@mediqus.local",
      phone: "11 5555-0000",
      bloodType: "A+",
      userId: users.get("paciente")!.id,
    },
  });

  // Una cirugía programada para mañana, así el portal del paciente tiene datos.
  const hasSurgery = await prisma.surgery.count({ where: { patientId: patient.id } });
  if (hasSurgery === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await prisma.surgery.create({
      data: {
        publicCode: "MQ-001",
        patientId: patient.id,
        operatingRoomId: q1.id,
        procedure: "Facoemulsificación (cataratas)",
        surgeonName: "Dr. Martín Ruiz",
        scheduledAt: tomorrow,
        priority: "normal",
        history: { create: { status: "programada", changedBy: users.get("admin")!.id } },
      },
    });
  }

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
  }

  console.log("Seed completo. Usuarios de prueba (ver CREDENCIALES.md):");
  for (const u of DEMO_USERS) console.log(`  ${u.role.padEnd(15)} ${u.email} / ${u.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
