// ======================================================
// Scheduler de recordatorios (lib/scheduler.ts)
// Tarea periódica en proceso (sin dependencias externas)
// que cada 15 minutos busca cirugías próximas y envía:
//   - Recordatorio 48 h antes (email + push)
//   - Recordatorio 24 h antes (email + push)
// La tabla EmailLog actúa como registro de idempotencia:
// cada recordatorio se envía UNA sola vez por cirugía,
// aunque el proceso se reinicie.
// ======================================================
import { prisma } from "./prisma.js";
import { sendSurgeryReminder, wasEmailSent } from "./email.js";
import { notifySurgeryReminder } from "./notifications.js";

/** Frecuencia de chequeo del scheduler. */
const TICK_MS = 15 * 60 * 1000;

/**
 * Busca cirugías cuya fecha cae dentro de la ventana [ahora, ahora + horas]
 * y les envía el recordatorio correspondiente si aún no se envió.
 * La ventana es acumulativa (48 incluye a 24), por eso se controla cada
 * tipo por separado con wasEmailSent().
 */
async function processReminders(hours: 48 | 24): Promise<void> {
  const now = new Date();
  const until = new Date(now.getTime() + hours * 60 * 60 * 1000);

  const upcoming = await prisma.surgery.findMany({
    where: {
      status: "programada",
      scheduledAt: { gte: now, lte: until },
    },
    include: { patient: true },
  });

  for (const s of upcoming) {
    const type = hours === 48 ? "recordatorio_48h" : "recordatorio_24h";
    if (await wasEmailSent(type, s.id)) continue;

    await sendSurgeryReminder(
      {
        patientEmail: s.patient.email,
        patientName: s.patient.firstName,
        procedure: s.procedure,
        scheduledAt: s.scheduledAt,
        surgeryId: s.id,
      },
      hours,
    );
    void notifySurgeryReminder(s.patientId, s.id, hours);
  }
}

/** Un ciclo del scheduler (48 h primero, luego 24 h). */
async function tick(): Promise<void> {
  try {
    await processReminders(48);
    await processReminders(24);
  } catch (error) {
    console.error("[scheduler] error en el ciclo de recordatorios:", error);
  }
}

/** Arranca el scheduler (llamado una vez desde server.ts). */
export function startReminderScheduler(): void {
  void tick(); // primer chequeo al arrancar
  setInterval(() => void tick(), TICK_MS);
  console.log("[scheduler] Recordatorios de cirugía activos (cada 15 min).");
}
