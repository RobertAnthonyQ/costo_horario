import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Eye, Info, Calculator } from "lucide-react";
import { HourlyCostReportResponse } from "../models/types";

interface ParametersFormProps {
  machines: any[];
  machineId: string;
  history: HourlyCostReportResponse[];
  selectedHistoryReport: HourlyCostReportResponse | null;
  posesionId: string;
  params: {
    mesesPorAnio: number;
    tasaFinanciamiento: number;
    aniosFinanciamiento: number;
    tasaSeguro: number;
    aniosSeguro: number;
    incluyeGastosDistribuibles: boolean;
    costoMCorrMayores: number;
    mano_de_obra_tecnico: number;
    comentario: string;
  };
  loadingMachines: boolean;
  historyLoading: boolean;
  calculatingPreview: boolean;
  savingReport: boolean;
  onMachineChange: (machineId: string) => void;
  onHistorySelect: (historyReport: HourlyCostReportResponse) => void;
  onPosesionIdChange: (posesionId: string) => void;
  onParamsChange: (params: any) => void;
  onPreview: () => void;
  onSave: () => void;
  onViewHistoryDetails?: (historyReport: HourlyCostReportResponse) => void;
}

export function ParametersForm({
  machines,
  machineId,
  history,
  selectedHistoryReport,
  posesionId,
  params,
  loadingMachines,
  historyLoading,
  calculatingPreview,
  savingReport,
  onMachineChange,
  onHistorySelect,
  onPosesionIdChange,
  onParamsChange,
  onPreview,
  onSave,
  onViewHistoryDetails,
}: ParametersFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parámetros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Paso 1: Seleccionar Máquina */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">1. Seleccionar Máquina</h3>
          <div>
            <Label>Máquina</Label>
            <select
              className="w-full border rounded-md h-10 px-3 bg-background"
              value={machineId}
              onChange={(e) => onMachineChange(e.target.value)}
              disabled={loadingMachines}
            >
              <option value="" disabled>
                {loadingMachines
                  ? "Cargando máquinas..."
                  : "Seleccionar máquina"}
              </option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id_equipo_interno || `Máquina ${m.id}`} -{" "}
                  {m?.modelo?.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Paso 2: Seleccionar Versión del Historial (solo si hay máquina seleccionada) */}
        {machineId && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              2. Seleccionar Versión del Historial
            </h3>
            <div>
              <Label>Versión del Historial de Costo Horario</Label>
              <select
                className="w-full border rounded-md h-10 px-3 bg-background"
                value={selectedHistoryReport?.id || ""}
                onChange={(e) => {
                  const report = history.find(
                    (h) => h.id.toString() === e.target.value
                  );
                  if (report) onHistorySelect(report);
                }}
                disabled={historyLoading}
              >
                <option value="" disabled>
                  {historyLoading
                    ? "Cargando historial..."
                    : "Seleccionar versión del historial"}
                </option>
                {history.map((historyItem) => (
                  <option key={historyItem.id} value={historyItem.id}>
                    {new Date(historyItem.fecha_calculo).toLocaleDateString()} -
                    {historyItem.resultado_completo_json?.comentario ||
                      "Sin comentario"}
                  </option>
                ))}
              </select>
              {selectedHistoryReport && (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-muted-foreground">
                    Versión calculada el{" "}
                    {new Date(
                      selectedHistoryReport.fecha_calculo
                    ).toLocaleString()}
                    {selectedHistoryReport.resultado_completo_json
                      ?.comentario &&
                      ` - ${selectedHistoryReport.resultado_completo_json.comentario}`}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (onViewHistoryDetails && selectedHistoryReport) {
                        onViewHistoryDetails(selectedHistoryReport);
                      }
                    }}
                    title="Ver detalles completos del historial"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paso 3: Parámetros (siempre visibles cuando hay máquina) */}
        {machineId && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">3. Parámetros del Cálculo</h3>
            {/* La versión de posesión se elige automáticamente (última disponible) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Label>Versión de Posesión</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Se usará automáticamente la versión de posesión más reciente
                  disponible.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Meses por año</Label>
                <Input
                  type="number"
                  value={params.mesesPorAnio}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      mesesPorAnio:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Tasa financiamiento (decimales)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={params.tasaFinanciamiento}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      tasaFinanciamiento:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ejemplo: (0.10)
                </p>
              </div>

              <div>
                <Label>Años financiamiento</Label>
                <Input
                  type="number"
                  value={params.aniosFinanciamiento}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      aniosFinanciamiento:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Tasa anual de seguro</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={params.tasaSeguro}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      tasaSeguro:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Años seguro</Label>
                <Input
                  type="number"
                  value={params.aniosSeguro}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      aniosSeguro:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>costoM Corr. Mayores (ratio)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={params.costoMCorrMayores}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      costoMCorrMayores:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Mano de Obra Técnico (Decimales)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.10 = 10%"
                  value={params.mano_de_obra_tecnico}
                  onChange={(e) =>
                    onParamsChange({
                      ...params,
                      mano_de_obra_tecnico:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ejemplo: (0.10)
                </p>
              </div>

              <div className="md:col-span-3">
                <Label>Comentario</Label>
                <Input
                  value={params.comentario}
                  onChange={(e) =>
                    onParamsChange({ ...params, comentario: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  if (onViewHistoryDetails && selectedHistoryReport) {
                    onViewHistoryDetails(selectedHistoryReport);
                  }
                }}
                disabled={!selectedHistoryReport}
                variant="outline"
                title="Ver el historial seleccionado"
              >
                <Eye className="h-4 w-4 mr-2" /> Ver historial
              </Button>

              <Button
                onClick={onPreview}
                disabled={calculatingPreview || savingReport || !machineId}
                variant="secondary"
                title="Calcular con parámetros actuales (no guarda en BD)"
              >
                {calculatingPreview && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Calculator className="h-4 w-4 mr-2" /> Calcular
              </Button>

              <Button
                onClick={onSave}
                disabled={calculatingPreview || savingReport || !machineId}
                title="Calcular y guardar en base de datos"
              >
                {savingReport && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" /> Calcular y Guardar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
