// ======================================================
// Email de prueba (scripts/send-test-email.ts)
// Verifica que la configuración de Brevo funcione mandando
// un email real a la dirección indicada. Queda registrado
// en EmailLog como cualquier otro envío.
//   Uso: npm run email:test -- destinatario@email.com
// ======================================================
import "dotenv/config";
import { sendEmail } from "../lib/email.js";
import { prisma } from "../lib/prisma.js";

const to = process.argv[2];
if (!to) {
  console.error("Uso: npm run email:test -- destinatario@email.com");
  process.exit(1);
}

const result = await sendEmail({
  to,
  type: "prueba",
  subject: "Prueba de envío — MediQ's",
  html: `<p>Si estás leyendo esto, los emails de MediQ's funcionan correctamente.</p>
         <p style="color:#94a3b8;font-size:12px;">Enviado el ${new Date().toLocaleString("es-AR")}.</p>`,
});

console.log(`Resultado: ${result.status}${result.detail ? ` — ${result.detail}` : ""}`);
await prisma.$disconnect();
process.exit(result.status === "enviado" ? 0 : 1);
