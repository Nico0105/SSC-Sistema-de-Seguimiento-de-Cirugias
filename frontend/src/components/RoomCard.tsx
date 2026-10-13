// ======================================================
// Tarjeta de quirófano (components/RoomCard.tsx)
// Una tarjeta por sala en el Inicio. Sólo responde lo que
// importa de un vistazo: ¿está ocupada?, ¿con qué?, ¿hay una
// demora? Toda la tarjeta lleva al detalle de la cirugía.
// ======================================================
import { Link } from "react-router-dom";
import { ROOM_STATE_INFO, type RoomSnapshot } from "../lib/room-status";
import { formatCode, formatDuration, formatTime, minutesBetween } from "../lib/format";
import { cn } from "../lib/cn";

export function RoomCard({ snapshot, now }: { snapshot: RoomSnapshot; now: Date }) {
  const { room, state, surgery, delayMinutes } = snapshot;
  const info = ROOM_STATE_INFO[state];

  const body = (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          <span className="font-mono text-slate-900">{room.code}</span>
          <span className="mx-2 text-slate-300">·</span>
          {room.name}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <span className={cn("h-1.5 w-1.5 rounded-full", info.dot)} />
          {info.label}
        </span>
      </div>

      {surgery ? (
        <div className="mt-6">
          <p className="text-lg font-medium leading-snug text-slate-900">{surgery.procedure}</p>
          <p className="mt-1.5 text-sm text-slate-500">
            <span className="font-mono">{formatCode(surgery.publicCode)}</span>
            <span className="mx-2 text-slate-300">·</span>
            {state === "en_cirugia" && surgery.startedAt
              ? `En curso hace ${formatDuration(minutesBetween(surgery.startedAt, now))}`
              : `Programada ${formatTime(surgery.scheduledAt)}`}
          </p>
          {state === "retraso" && <p className="mt-3 text-sm text-rose-600">Demora de {delayMinutes} min</p>}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-400">Sin cirugías pendientes hoy</p>
      )}
    </>
  );

  const classes = "block rounded-2xl border border-slate-100 bg-white p-7 shadow-[0_1px_2px_rgb(15_23_42/0.03)]";
  return surgery ? (
    <Link to={`/surgeries/${surgery.id}`} className={cn(classes, "transition-shadow hover:shadow-md")}>
      {body}
    </Link>
  ) : (
    <article className={classes}>{body}</article>
  );
}
