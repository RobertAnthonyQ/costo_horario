import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Minus, Expand } from "lucide-react";
import { Scenario } from "../models/types";
import { useState } from "react";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              2
            </div>
            Escenarios de Operación
          </CardTitle>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Expand className="h-4 w-4 mr-2" />
                Expandir
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configuración Detallada de Escenarios</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Modal Content - Expanded View */}
                <div className="grid gap-4">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="p-4 border rounded-lg space-y-4"
                    >
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
                          <Label htmlFor={`modal-hours-${scenario.id}`}>
                            Horas Mínimas/Mes
                          </Label>
                          <Input
                            id={`modal-hours-${scenario.id}`}
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
                          <Label htmlFor={`modal-operatividad-${scenario.id}`}>
                            Grado de Operatividad (0-1)
                          </Label>
                          <Input
                            id={`modal-operatividad-${scenario.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={scenario.gradoDeOperatividad}
                            onChange={(e) =>
                              onUpdateScenario(
                                scenario.id,
                                "gradoDeOperatividad",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`modal-factor-${scenario.id}`}>
                            Factor de Mercado (0-2)
                          </Label>
                          <Input
                            id={`modal-factor-${scenario.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="2"
                            value={scenario.factorDeMercado}
                            onChange={(e) =>
                              onUpdateScenario(
                                scenario.id,
                                "factorDeMercado",
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
                          {(scenario.gradoDeOperatividad * 100).toFixed(0)}%
                        </div>
                        <div>
                          <span className="font-medium">Factor:</span>{" "}
                          {scenario.factorDeMercado.toFixed(2)}x
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={onAddScenario}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Escenario
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headers Row */}
        <div className="grid grid-cols-10 gap-2 text-xs font-medium text-muted-foreground px-2">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Horas/Mes</div>
          <div className="col-span-3">Grado Operatividad (0-1)</div>
          <div className="col-span-3">Factor Mercado (0-2)</div>
          <div className="col-span-1">Acciones</div>
        </div>

        {/* Scenarios Rows */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="grid grid-cols-10 gap-2 items-center p-2 border rounded-lg"
            >
              {/* Scenario Number */}
              <div className="col-span-1 text-center font-medium text-sm">
                {scenario.id}
              </div>

              {/* Horas Minimas */}
              <div className="col-span-2">
                <Input
                  type="number"
                  value={scenario.horasMinimas}
                  onChange={(e) =>
                    onUpdateScenario(
                      scenario.id,
                      "horasMinimas",
                      Number(e.target.value)
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>

              {/* Grado de Operatividad */}
              <div className="col-span-3">
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={scenario.gradoDeOperatividad}
                    onChange={(e) =>
                      onUpdateScenario(
                        scenario.id,
                        "gradoDeOperatividad",
                        Number(e.target.value)
                      )
                    }
                    className="h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground min-w-fit">
                    ({(scenario.gradoDeOperatividad * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Factor de Mercado */}
              <div className="col-span-3">
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="2"
                    value={scenario.factorDeMercado}
                    onChange={(e) =>
                      onUpdateScenario(
                        scenario.id,
                        "factorDeMercado",
                        Number(e.target.value)
                      )
                    }
                    className="h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground min-w-fit">
                    ({scenario.factorDeMercado.toFixed(2)}x)
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-center">
                {scenarios.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveScenario(scenario.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Button */}
        <Button
          variant="outline"
          onClick={onAddScenario}
          size="sm"
          className="w-full mt-3"
        >
          <Plus className="mr-2 h-3 w-3" />
          Agregar Escenario
        </Button>
      </CardContent>
    </Card>
  );
};
