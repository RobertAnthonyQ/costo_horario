import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { picsService } from "./services/picsService";
import { PICsTable } from "./components";
import { PICsEditorPanel } from "./components/PICsEditorPanel";
import { machinesService } from "../../machines/services/machinesService";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Truck, RefreshCw } from "lucide-react";

interface MachineLite {
  id: number;
  id_equipo_interno?: string;
  modelo?: { id: number; nombre?: string; marca?: { nombre: string } };
  modelo_id?: number;
}

const PICsPage: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [machines, setMachines] = useState<MachineLite[]>([]);
  const [loadedMachines, setLoadedMachines] = useState(false);

  // Cargar máquinas (una sola vez)
  useQuery({
    queryKey: ["pics", "machines"],
    queryFn: async () => {
      const resp = await machinesService.getAllMachines();
      if (resp.success && resp.data) {
        setMachines(resp.data as any);
        setLoadedMachines(true);
      }
      return resp;
    },
  });

  const selectedModeloId = useMemo(() => {
    if (!selectedMachine) return undefined;
    const m = machines.find((mm) => mm.id.toString() === selectedMachine);
    return m?.modelo?.id || m?.modelo_id;
  }, [selectedMachine, machines]);

  const {
    data: recordsResp,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["pics", "by-modelo", selectedModeloId],
    queryFn: () => picsService.byModelo(selectedModeloId as number),
    enabled: loadedMachines && !!selectedModeloId, // solo cargar cuando el usuario seleccionó máquina
  });

  const records = recordsResp?.data || [];
  const hasFilter = Boolean(selectedModeloId);
  const loadError =
    !isLoading && recordsResp && !recordsResp.success
      ? recordsResp.error
      : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">PICs</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de PCR y montos por componente / modelo con distribución y
            monto aplicado.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-1 min-w-[240px]">
            <label className="text-xs font-medium text-muted-foreground">
              Máquina (deriva modelo)
            </label>
            <Select
              value={selectedMachine}
              onValueChange={(val) => setSelectedMachine(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar máquina" />
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-72">
                {machines.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{m.id_equipo_interno || `Máq ${m.id}`}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {m.modelo?.marca?.nombre} {m.modelo?.nombre}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMachine("")}
            >
              Quitar filtro
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching ? "Actualizando" : "Refrescar"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {hasFilter ? (
          <p className="text-xs text-muted-foreground">
            Modelo seleccionado (ID: {selectedModeloId})
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Selecciona una máquina para comenzar a editar y ver el historial.
          </p>
        )}
        {loadError && (
          <div className="p-4 border border-destructive/30 bg-destructive/5 text-destructive text-sm rounded-md">
            Error cargando datos: {loadError}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 h-[520px]">
            {selectedModeloId ? (
              <PICsEditorPanel modeloId={selectedModeloId} />
            ) : (
              <div className="border rounded-md h-full p-6 flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <p className="font-medium mb-1">Panel de Edición</p>
                <p>
                  Selecciona una máquina para editar PCR y Monto USD de sus
                  componentes.
                </p>
              </div>
            )}
          </div>
          <div className="lg:col-span-8">
            {selectedModeloId ? (
              !loadError && !isLoading && records.length === 0 ? (
                <div className="p-6 border rounded-md text-center text-sm text-muted-foreground">
                  No hay registros históricos para este modelo todavía.
                </div>
              ) : (
                <PICsTable
                  records={records}
                  loading={isLoading || !!loadError}
                />
              )
            ) : (
              <div className="p-6 border rounded-md text-center text-sm text-muted-foreground h-[520px] flex items-center justify-center">
                Selecciona una máquina para ver el historial de PICs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PICsPage;
