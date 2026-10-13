// ======================================================
// Cirugías (pages/Surgeries.tsx)
// Listado completo de cirugías en tiempo real, con buscador y
// filtro por etapa, más el alta desde el panel lateral
// "Programar cirugía" (components/ScheduleSurgerySheet.tsx).
// El panel también se abre desde el Inicio con /surgeries?nueva=1.
// Toda cirugía nace "programada"; su estado se avanza desde la
// página de detalle siguiendo el flujo quirúrgico documentado.
// ======================================================
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { can } from "../lib/permissions";
import { getErrorMessage } from "../lib/api-client";
import type { SurgeryStatus } from "../lib/surgery-status";
import { useSurgeriesQuery } from "../hooks/use-surgeries-query";
import { usePatientsQuery, useRoomsQuery } from "../hooks/use-catalog-queries";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DataTable } from "../components/ui/data-table";
import { ErrorAlert } from "../components/ui/alert";
import { FilterPills, type FilterOption } from "../components/ui/filter-pills";
import { PageHeader } from "../components/ui/page-header";
import { ScheduleSurgerySheet } from "../components/ScheduleSurgerySheet";
import { buildSurgeryColumns } from "../components/SurgeryColumns";

/** Agrupación simple de estados para el filtro (en lugar de un filtro por estado). */
type Group = "todas" | "programadas" | "en_curso" | "finalizadas";
const GROUPS: Record<Exclude<Group, "todas">, SurgeryStatus[]> = {
  programadas: ["programada"],
  en_curso: ["en_quirofano", "esperando_en_sala", "postoperatorio"],
  finalizadas: ["alta", "cancelada"],
};

const columns = buildSurgeryColumns({ showDate: true });

export default function Surgeries() {
  const { user } = useAuth();
  const canEdit = can(user?.roles, "cirugias:escribir");
  const [params, setParams] = useSearchParams();
  const [group, setGroup] = useState<Group>("todas");

  const { data: surgeries = [], isLoading, error } = useSurgeriesQuery();
  const { data: patients = [] } = usePatientsQuery();
  const { data: rooms = [] } = useRoomsQuery();

  // El panel de alta se controla por la URL (?nueva=1) para poder abrirlo desde otras pantallas.
  const sheetOpen = canEdit && params.get("nueva") === "1";
  const setSheetOpen = (open: boolean) => {
    const next = new URLSearchParams(params);
    if (open) next.set("nueva", "1");
    else next.delete("nueva");
    setParams(next, { replace: true });
  };

  const sorted = useMemo(
    () => [...surgeries].sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt)),
    [surgeries],
  );
  const inGroup = (g: Exclude<Group, "todas">) => sorted.filter((s) => GROUPS[g].includes(s.status));
  const visible = group === "todas" ? sorted : inGroup(group);

  const options: FilterOption<Group>[] = [
    { value: "todas", label: "Todas", count: sorted.length },
    { value: "programadas", label: "Programadas", count: inGroup("programadas").length },
    { value: "en_curso", label: "En curso", count: inGroup("en_curso").length },
    { value: "finalizadas", label: "Finalizadas", count: inGroup("finalizadas").length },
  ];

  return (
    <>
      <PageHeader
        title="Cirugías"
        description="Todas las intervenciones y su etapa en el circuito quirúrgico."
        actions={
          canEdit && (
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="h-4 w-4" /> Programar cirugía
            </Button>
          )
        }
      />

      {error && (
        <div className="mb-8">
          <ErrorAlert message={getErrorMessage(error)} />
        </div>
      )}

      <Card>
        <DataTable
          columns={columns}
          data={visible}
          isLoading={isLoading}
          searchPlaceholder="Buscar paciente, código o procedimiento"
          emptyMessage={group === "todas" ? "Todavía no hay cirugías registradas" : "Ninguna cirugía en este grupo"}
          toolbar={<FilterPills options={options} value={group} onChange={setGroup} ariaLabel="Filtrar por etapa" />}
        />
      </Card>

      {canEdit && (
        <ScheduleSurgerySheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          patients={patients}
          rooms={rooms}
          surgeries={surgeries}
        />
      )}
    </>
  );
}
