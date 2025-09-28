import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, History, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Machine, PossessionVersion } from "../models/types";
import { machinesService } from "../../../machines/services/machinesService";
import { possessionService } from "../services/possessionService";

interface MachineSelectionProps {
  selectedMachine: string;
  onMachineSelect: (value: string) => void;
  selectedVersion?: string;
  onVersionSelect: (value: string) => void;
}

export const MachineSelection = ({
  selectedMachine,
  onMachineSelect,
  selectedVersion,
  onVersionSelect,
}: MachineSelectionProps) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [availableVersions, setAvailableVersions] = useState<
    PossessionVersion[]
  >([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [machinesError, setMachinesError] = useState<string | null>(null);
  const [versionsError, setVersionsError] = useState<string | null>(null);

  // Cargar todas las máquinas al montar el componente
  useEffect(() => {
    const loadMachines = async () => {
      console.log("🚀 Cargando máquinas...");
      setLoadingMachines(true);
      setMachinesError(null);

      try {
        const response = await machinesService.getAllMachines();

        if (response.success && response.data) {
          console.log(
            "✅ Máquinas cargadas exitosamente:",
            response.data.length
          );
          setMachines(response.data);
        } else {
          console.error("❌ Error en la respuesta:", response.error);
          setMachinesError(response.error || "Error al cargar las máquinas");
        }
      } catch (error) {
        console.error("❌ Error al cargar máquinas:", error);
        setMachinesError("Error de conexión al cargar las máquinas");
      } finally {
        setLoadingMachines(false);
      }
    };

    loadMachines();
  }, []);

  // Cargar versiones cuando se selecciona una máquina
  useEffect(() => {
    const loadVersions = async () => {
      if (!selectedMachine) {
        setAvailableVersions([]);
        return;
      }

      console.log("🚀 Cargando versiones para máquina:", selectedMachine);
      setLoadingVersions(true);
      setVersionsError(null);

      try {
        const machineId = parseInt(selectedMachine);
        const response =
          await possessionService.getPossessionSummaryByMachine(machineId);

        if (response.success && response.data) {
          console.log(
            "✅ Versiones cargadas exitosamente:",
            response.data.length
          );
          setAvailableVersions(response.data);
          // Si no hay versiones disponibles, seleccionar automáticamente "Nuevo Cálculo"
          if (response.data.length === 0 && selectedVersion !== "new") {
            onVersionSelect("new");
          }
        } else {
          console.error(
            "❌ Error en la respuesta de versiones:",
            response.error
          );
          // No mostrar error si simplemente no hay versiones
          if (
            response.error?.includes("404") ||
            response.error?.includes("not found")
          ) {
            setAvailableVersions([]);
            // Seleccionar automáticamente "Nuevo Cálculo" cuando no exista historial
            if (selectedVersion !== "new") {
              onVersionSelect("new");
            }
          } else {
            setVersionsError(response.error || "Error al cargar las versiones");
          }
        }
      } catch (error) {
        console.error("❌ Error al cargar versiones:", error);
        setVersionsError("Error de conexión al cargar las versiones");
      } finally {
        setLoadingVersions(false);
      }
    };

    loadVersions();
  }, [selectedMachine]);

  const selectedMachineData = machines.find(
    (m) => m.id.toString() === selectedMachine
  );

  const selectedVersionData = selectedVersion
    ? availableVersions.find((v) => v.id.toString() === selectedVersion)
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            1
          </div>
          Selección de Máquina
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Error al cargar máquinas */}
          {machinesError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{machinesError}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="machine">Máquina</Label>
            <Select
              value={selectedMachine}
              onValueChange={onMachineSelect}
              disabled={loadingMachines}
            >
              <SelectTrigger>
                {loadingMachines ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando máquinas...
                  </div>
                ) : (
                  <SelectValue placeholder="Seleccionar máquina" />
                )}
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {machines.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>
                          {machine.id_equipo_interno || `Máquina ${machine.id}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {machine.modelo.marca.nombre} -{" "}
                          {machine.modelo.nombre}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error al cargar versiones */}
          {versionsError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{versionsError}</AlertDescription>
            </Alert>
          )}

          {/* Selector de Versión - aparece solo si hay máquina seleccionada */}
          {selectedMachine && (
            <div>
              <Label htmlFor="version">Versión de Posesión</Label>
              <Select
                value={selectedVersion || ""}
                onValueChange={onVersionSelect}
                disabled={loadingVersions}
              >
                <SelectTrigger>
                  {loadingVersions ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando versiones...
                    </div>
                  ) : (
                    <SelectValue placeholder="Seleccionar versión (opcional)" />
                  )}
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="text-primary font-medium">
                        Nuevo Cálculo
                      </span>
                    </div>
                  </SelectItem>
                  {availableVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id.toString()}>
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {new Date(version.fecha_calculo).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {version.numero_escenarios} escenarios
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mensaje cuando no hay versiones */}
          {selectedMachine &&
            availableVersions.length === 0 &&
            !loadingVersions &&
            !versionsError && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg">
                <Truck className="h-4 w-4" />
                <span>
                  No hay versiones guardadas para esta máquina. Se creará un
                  nuevo cálculo.
                </span>
              </div>
            )}

          {selectedMachineData && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Valor Inicial</p>
                <p className="text-lg font-semibold">
                  $
                  {selectedMachineData.valor_similar_nuevo?.toLocaleString() ||
                    "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Vida Útil Estimada
                </p>
                <p className="text-lg font-semibold">
                  {selectedMachineData.vida_util || "N/A"} horas
                </p>
              </div>
            </div>
          )}

          {/* Información de la versión seleccionada */}
          {selectedVersionData && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Versión Cargada
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Comentario:</span>{" "}
                  {selectedVersionData.comentario}
                </p>
                <p>
                  <span className="font-medium">Fecha:</span>{" "}
                  {new Date(
                    selectedVersionData.fecha_calculo
                  ).toLocaleDateString("es-ES")}
                </p>
                <p>
                  <span className="font-medium">Escenarios:</span>{" "}
                  {selectedVersionData.numero_escenarios}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
