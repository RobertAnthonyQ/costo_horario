import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck } from "lucide-react";
import { CalculationMachine } from "../models/types";

interface MachineSelectionProps {
  machines: CalculationMachine[];
  selectedMachine: string;
  onMachineSelect: (value: string) => void;
}

export const MachineSelection = ({
  machines,
  selectedMachine,
  onMachineSelect,
}: MachineSelectionProps) => {
  const selectedMachineData = machines.find(
    (m) => m.id.toString() === selectedMachine
  );

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
          <div>
            <Label htmlFor="machine">Máquina</Label>
            <Select value={selectedMachine} onValueChange={onMachineSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar máquina" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {machines.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {machine.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMachineData && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Valor Inicial</p>
                <p className="text-lg font-semibold">
                  ${selectedMachineData.value.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Vida Útil Estimada
                </p>
                <p className="text-lg font-semibold">
                  {selectedMachineData.lifeYears} años
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
