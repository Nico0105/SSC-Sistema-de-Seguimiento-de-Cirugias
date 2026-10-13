// ======================================================
// DateTimeField (components/ui/datetime-field.tsx)
// Fecha + hora en formato de 24 horas (00–23) para agendar
// cirugías y turnos. Reemplaza al <input type="datetime-local">
// nativo, cuyo reloj depende del idioma del sistema operativo
// (en Windows en inglés muestra AM/PM) y no se puede forzar.
// Entrega el mismo valor que el input nativo: "AAAA-MM-DDTHH:mm"
// (o "" mientras falte algún dato), así los formularios no cambian.
// ======================================================
import { useEffect, useId, useState } from "react";
import { cn } from "../../lib/cn";
import { FIELD_CLASSES } from "./input";

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** Separa "AAAA-MM-DDTHH:mm" en sus partes (vacías si no hay valor). */
function split(value: string) {
  const [date = "", time = ""] = value.split("T");
  const [hour = "", minute = ""] = time.split(":");
  return { date, hour, minute };
}

export function DateTimeField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const id = useId();
  // Estado propio: permite elegir la hora antes que la fecha sin perderla.
  const [parts, setParts] = useState(() => split(value));

  // Si el formulario se resetea desde afuera (value = ""), se limpian las partes.
  useEffect(() => {
    const combined = parts.date && parts.hour && parts.minute ? `${parts.date}T${parts.hour}:${parts.minute}` : "";
    if (value !== combined) setParts(split(value));
    // Sólo reacciona a cambios externos del valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function update(next: Partial<typeof parts>) {
    const merged = { ...parts, ...next };
    setParts(merged);
    onChange(merged.date && merged.hour && merged.minute ? `${merged.date}T${merged.hour}:${merged.minute}` : "");
  }

  return (
    <fieldset>
      <legend className="text-xs font-semibold text-slate-700 mb-1.5">{label}</legend>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          id={`${id}-date`}
          type="date"
          aria-label={`${label}: fecha`}
          value={parts.date}
          onChange={(e) => update({ date: e.target.value })}
          required={required}
          className={FIELD_CLASSES}
        />
        <div className="flex items-center gap-1">
          <select
            aria-label={`${label}: hora (24 h)`}
            value={parts.hour}
            onChange={(e) => update({ hour: e.target.value })}
            required={required}
            className={cn(FIELD_CLASSES, "w-[4.5rem] font-mono")}
          >
            <option value="">HH</option>
            {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="font-mono font-bold text-slate-500">:</span>
          <select
            aria-label={`${label}: minutos`}
            value={parts.minute}
            onChange={(e) => update({ minute: e.target.value })}
            required={required}
            className={cn(FIELD_CLASSES, "w-[4.5rem] font-mono")}
          >
            <option value="">MM</option>
            {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
    </fieldset>
  );
}
