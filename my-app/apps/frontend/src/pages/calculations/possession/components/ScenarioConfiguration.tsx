import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import { Scenario } from "../models/types";

interface ScenarioConfigurationProps {
  scenarios: Scenario[];
  onAddScenario: () => void;
  onRemoveScenario: (id: number) => void;
  onUpdateScenario: (id: number, field: keyof Scenario, value: number) => void;
}

export const ScenarioConfiguration = ({
  scenarios,
  onAddScenario,
  onRemoveScenario,
  onUpdateScenario,
}: ScenarioConfigurationProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            2
          </div>
          Escenarios de Operación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Escenario {scenario.id}</h4>
                <div className="flex gap-2">
                  {scenarios.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onRemoveScenario(scenario.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`hours-${scenario.id}`}>
                    Horas Mínimas/Mes
                  </Label>
                  <Input
                    id={`hours-${scenario.id}`}
                    type="number"
                    value={scenario.horasMinimas}
                    onChange={(e) =>
                      onUpdateScenario(
                        scenario.id,
                        "horasMinimas",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`operatividad-${scenario.id}`}>
                    Grado de Operatividad (0-1)
                  </Label>
                  <Input
                    id={`operatividad-${scenario.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={scenario.operatividad}
                    onChange={(e) =>
                      onUpdateScenario(
                        scenario.id,
                        "operatividad",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`factor-${scenario.id}`}>
                    Factor de Mercado (0-2)
                  </Label>
                  <Input
                    id={`factor-${scenario.id}`}
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={scenario.factorMercado}
                    onChange={(e) =>
                      onUpdateScenario(
                        scenario.id,
                        "factorMercado",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Horas/Año:</span>{" "}
                  {(scenario.horasMinimas * 12).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Operatividad:</span>{" "}
                  {(scenario.operatividad * 100).toFixed(0)}%
                </div>
                <div>
                  <span className="font-medium">Factor:</span>{" "}
                  {scenario.factorMercado}x
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={onAddScenario} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Escenario
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
