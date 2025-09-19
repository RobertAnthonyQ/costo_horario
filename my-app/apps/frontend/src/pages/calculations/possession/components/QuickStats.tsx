import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Calculator } from "lucide-react";
import { CalculationMachine } from "../models/types";

interface QuickStatsProps {
  selectedMachine: string;
  machines: CalculationMachine[];
  scenarioCount: number;
}

export const QuickStats = ({
  selectedMachine,
  machines,
  scenarioCount,
}: QuickStatsProps) => {
  const selectedMachineData = machines.find(
    (m) => m.id.toString() === selectedMachine
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumen Rápido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Máquina Seleccionada
            </p>
            <p className="font-medium">
              {selectedMachineData?.name || "Ninguna"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Escenarios Definidos
            </p>
            <p className="font-medium">{scenarioCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
