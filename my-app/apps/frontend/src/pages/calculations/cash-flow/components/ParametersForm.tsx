import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Info, Calculator, Save } from "lucide-react";
import { FlujoCajaVersion } from "../models/types";

interface ParametersFormProps {
  machines: any[];
  machineId: string;
  versions: FlujoCajaVersion[];
  selectedVersion: FlujoCajaVersion | null;
  params: {
    porcentajeResidual: number;
    margenInterno: number;
    gastosGeneralesMantenimiento: number;
    horasOperativasMes: number;
    tasaDescuentoEmpresa: number;
    comentario: string;
  };
  loadingMachines: boolean;
  versionsLoading: boolean;
  calculatingPreview: boolean;
  savingReport: boolean;
  showHistory: boolean;
  onMachineChange: (machineId: string) => void;
  onVersionSelect: (version: FlujoCajaVersion) => void;
  onParamsChange: (params: any) => void;
  onPreview: () => void;
  onSave: () => void;
  onToggleHistory: () => void;
  onViewVersionDetails?: (version: FlujoCajaVersion) => void;
}

export function ParametersForm({
  machines,
  machineId,
  versions,
  selectedVersion,
  params,
  loadingMachines,
  versionsLoading,
  calculatingPreview,
  savingReport,
  showHistory,
  onMachineChange,
  onVersionSelect,
  onParamsChange,
  onPreview,
  onSave,
  onToggleHistory,
  onViewVersionDetails,
}: ParametersFormProps) {
  // Helper para manejar conversión de porcentajes sin problemas de precisión
  const handlePercentageChange = (value: string, field: string) => {
    if (value === "") {
      onParamsChange({ ...params, [field]: 0 });
      return;
    }

    // Redondear a 2 decimales para evitar problemas de precisión
    const numValue = Math.round(parseFloat(value) * 100) / 10000;
    onParamsChange({ ...params, [field]: numValue });
  };

  // Helper para manejar números enteros
  const handleIntegerChange = (value: string, field: string) => {
    if (value === "") {
      onParamsChange({ ...params, [field]: 0 });
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onParamsChange({ ...params, [field]: numValue });
    }
  };

  // Helper para formatear valores de porcentaje
  const formatPercentage = (value: number): string => {
    return (Math.round(value * 10000) / 100).toString();
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parámetros del Análisis de Flujo de Caja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Paso 1: Seleccionar Máquina */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
              1
            </span>
            Seleccionar Máquina
          </h3>
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
            <p className="text-xs text-muted-foreground mt-1">
              <Info className="inline h-3 w-3 mr-1" />
              Selecciona la máquina para la cual deseas realizar el análisis de
              flujo de caja
            </p>
          </div>
        </div>

        {/* Paso 2: Versiones anteriores (opcional) */}
        {machineId && versions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                2
              </span>
              Versiones Anteriores (Opcional)
            </h3>
            <div>
              <Label>Versión del Historial</Label>
              <select
                className="w-full border rounded-md h-10 px-3 bg-background"
                value={selectedVersion?.id || ""}
                onChange={(e) => {
                  const version = versions.find(
                    (v) => v.id.toString() === e.target.value
                  );
                  if (version) onVersionSelect(version);
                }}
                disabled={versionsLoading}
              >
                <option value="">
                  {versionsLoading
                    ? "Cargando versiones..."
                    : "Nuevo análisis (sin versión previa)"}
                </option>
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {new Date(version.fechaCalculo).toLocaleDateString()} -{" "}
                    {version.nombre || "Sin nombre"}
                  </option>
                ))}
              </select>
              {selectedVersion && (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-muted-foreground">
                    Versión del{" "}
                    {new Date(selectedVersion.fechaCalculo).toLocaleString()}
                  </p>
                  {onViewVersionDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewVersionDetails(selectedVersion)}
                      title="Ver detalles de esta versión"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paso 3: Parámetros del Cálculo */}
        {machineId && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                {versions.length > 0 ? "3" : "2"}
              </span>
              Parámetros del Cálculo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Porcentaje Residual (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formatPercentage(params.porcentajeResidual)}
                  onChange={(e) =>
                    handlePercentageChange(e.target.value, "porcentajeResidual")
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valor residual del activo (ej: 10%)
                </p>
              </div>

              <div>
                <Label>Margen Interno (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formatPercentage(params.margenInterno)}
                  onChange={(e) =>
                    handlePercentageChange(e.target.value, "margenInterno")
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Margen de ganancia esperado (ej: 5%)
                </p>
              </div>

              <div>
                <Label>Gastos Generales Mantenimiento (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formatPercentage(params.gastosGeneralesMantenimiento)}
                  onChange={(e) =>
                    handlePercentageChange(
                      e.target.value,
                      "gastosGeneralesMantenimiento"
                    )
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Gastos generales sobre mantenimiento (ej: 5%)
                </p>
              </div>

              <div>
                <Label>Horas Operativas / Mes</Label>
                <Input
                  type="number"
                  min="0"
                  value={params.horasOperativasMes}
                  onChange={(e) =>
                    handleIntegerChange(e.target.value, "horasOperativasMes")
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Horas de operación estimadas por mes
                </p>
              </div>

              <div>
                <Label>Tasa de Descuento Empresa (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formatPercentage(params.tasaDescuentoEmpresa)}
                  onChange={(e) =>
                    handlePercentageChange(
                      e.target.value,
                      "tasaDescuentoEmpresa"
                    )
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tasa de descuento para el VAN (ej: 8%)
                </p>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <Label>Comentario</Label>
                <Input
                  value={params.comentario}
                  onChange={(e) =>
                    onParamsChange({ ...params, comentario: e.target.value })
                  }
                  placeholder="Descripción del análisis..."
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onToggleHistory}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showHistory ? "Ocultar Historial" : "Ver Historial"}
              </Button>
              <Button
                variant="secondary"
                onClick={onPreview}
                disabled={calculatingPreview || savingReport}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                {calculatingPreview ? "Calculando..." : "Calcular"}
              </Button>
              <Button
                onClick={onSave}
                disabled={calculatingPreview || savingReport}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {savingReport ? "Guardando..." : "Calcular y Guardar"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
