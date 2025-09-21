import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Eye } from "lucide-react";

interface ParametersFormProps {
  machines: any[];
  machineId: string;
  posesionId: string;
  params: {
    mesesPorAnio: number;
    tasaFinanciamiento: number;
    aniosFinanciamiento: number;
    tasaSeguro: number;
    aniosSeguro: number;
    incluyeGastosDistribuibles: boolean;
    costoMCorrMayores: number;
    comentario: string;
  };
  loadingMachines: boolean;
  submitting: boolean;
  onMachineChange: (machineId: string) => void;
  onPosesionIdChange: (posesionId: string) => void;
  onParamsChange: (params: any) => void;
  onPreview: () => void;
  onSave: () => void;
}

export function ParametersForm({
  machines,
  machineId,
  posesionId,
  params,
  loadingMachines,
  submitting,
  onMachineChange,
  onPosesionIdChange,
  onParamsChange,
  onPreview,
  onSave,
}: ParametersFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parámetros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Máquina</Label>
            <select
              className="w-full border rounded-md h-10 px-3 bg-background"
              value={machineId}
              onChange={(e) => onMachineChange(e.target.value)}
              disabled={loadingMachines}
            >
              <option value="" disabled>
                {loadingMachines ? "Cargando máquinas..." : "Seleccionar"}
              </option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id_equipo_interno || `Máquina ${m.id}`} -{" "}
                  {m?.modelo?.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Posesión (ID)</Label>
            <Input
              placeholder="ID de posesión"
              value={posesionId}
              onChange={(e) => onPosesionIdChange(e.target.value)}
            />
          </div>

          <div>
            <Label>Meses por año</Label>
            <Input
              type="number"
              value={params.mesesPorAnio}
              onChange={(e) =>
                onParamsChange({
                  ...params,
                  mesesPorAnio: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label>Tasa financiamiento</Label>
            <Input
              type="number"
              step="0.0001"
              value={params.tasaFinanciamiento}
              onChange={(e) =>
                onParamsChange({
                  ...params,
                  tasaFinanciamiento: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label>Años financiamiento</Label>
            <Input
              type="number"
              value={params.aniosFinanciamiento}
              onChange={(e) =>
                onParamsChange({
                  ...params,
                  aniosFinanciamiento: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label>Tasa seguro</Label>
            <Input
              type="number"
              step="0.0001"
              value={params.tasaSeguro}
              onChange={(e) =>
                onParamsChange({
                  ...params,
                  tasaSeguro: Number(e.target.value),
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
                  aniosSeguro: Number(e.target.value),
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
                  costoMCorrMayores: Number(e.target.value),
                })
              }
            />
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

        <div className="flex gap-2 mt-2">
          <Button
            onClick={onPreview}
            disabled={submitting || !machineId}
            variant="secondary"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Eye className="h-4 w-4 mr-2" /> Vista previa
          </Button>
          <Button onClick={onSave} disabled={submitting || !machineId}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4 mr-2" /> Calcular y guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
