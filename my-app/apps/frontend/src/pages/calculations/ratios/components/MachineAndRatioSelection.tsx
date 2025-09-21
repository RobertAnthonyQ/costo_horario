import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { machinesService } from "../../../machines/services/machinesService";
import { Machine } from "../../possession/models/types";
import { IndividualRatioInput, RatioType } from "../models/types";

interface Props {
  selectedMachine: string;
  onMachineSelect: (val: string) => void;
  ratioTypes: RatioType[];
  input: IndividualRatioInput;
  onInputChange: (next: IndividualRatioInput) => void;
}

export default function MachineAndRatioSelection({
  selectedMachine,
  onMachineSelect,
  ratioTypes,
  input,
  onInputChange,
}: Props) {
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    machinesService.getAllMachines().then((res) => {
      if (res.success && res.data) setMachines(res.data);
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selección de Máquina y Ratio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Máquina</Label>
          <Select value={selectedMachine} onValueChange={onMachineSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar máquina" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {machines.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.id_equipo_interno || `Máquina ${m.id}`} —{" "}
                  {m.modelo?.marca?.nombre} {m.modelo?.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tipo de Ratio</Label>
          <Select
            value={String(input.tipo_ratio_id)}
            onValueChange={(v) =>
              onInputChange({
                ...input,
                tipo_ratio_id: v === "" ? "" : Number(v),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {ratioTypes.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Valor</Label>
          <Input
            type="number"
            value={String(input.valor)}
            onChange={(e) =>
              onInputChange({
                ...input,
                valor: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <Label>Fecha efectiva</Label>
          <Input
            type="date"
            value={input.fecha_efectiva.split("T")[0] || ""}
            disabled
            readOnly
          />
          <div className="text-xs text-muted-foreground mt-1">
            Se usará la fecha actual automáticamente
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
