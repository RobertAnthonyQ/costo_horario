import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Save, Calculator } from "lucide-react";
import {
  MachineSelection,
  ScenarioConfiguration,
  Comments,
  QuickStats,
  DepreciationChart,
  ScenarioResults,
} from "./components";
import { machines, depreciationData, scenarioResults } from "./models/data";
import { Scenario } from "./models/types";

export default function PossessionCalculation() {
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: 1, horasMinimas: 200, operatividad: 0.75, factorMercado: 1.2 },
  ]);
  const [showResults, setShowResults] = useState(false);
  const [comments, setComments] = useState("");

  const addScenario = () => {
    const newScenario: Scenario = {
      id: scenarios.length + 1,
      horasMinimas: 200,
      operatividad: 0.75,
      factorMercado: 1.2,
    };
    setScenarios([...scenarios, newScenario]);
  };

  const removeScenario = (id: number) => {
    if (scenarios.length > 1) {
      setScenarios(scenarios.filter((s) => s.id !== id));
    }
  };

  const updateScenario = (id: number, field: keyof Scenario, value: number) => {
    setScenarios(
      scenarios.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const calculatePossession = () => {
    setShowResults(true);
  };

  const previewCalculation = () => {
    console.log("Preview calculation");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Cálculo de Posesión
        </h1>
        <p className="text-muted-foreground mt-1">
          Define escenarios de operación para calcular el valor de posesión de
          tu maquinaria
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Machine Selection */}
          <MachineSelection
            machines={machines}
            selectedMachine={selectedMachine}
            onMachineSelect={setSelectedMachine}
          />

          {/* Step 2: Scenarios */}
          <ScenarioConfiguration
            scenarios={scenarios}
            onAddScenario={addScenario}
            onRemoveScenario={removeScenario}
            onUpdateScenario={updateScenario}
          />

          {/* Step 3: Comments */}
          <Comments comments={comments} onCommentsChange={setComments} />

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={previewCalculation}>
              <Eye className="mr-2 h-4 w-4" />
              Vista Previa
            </Button>
            <Button onClick={calculatePossession} disabled={!selectedMachine}>
              <Calculator className="mr-2 h-4 w-4" />
              Calcular y Guardar
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <QuickStats
            selectedMachine={selectedMachine}
            machines={machines}
            scenarioCount={scenarios.length}
          />

          {/* Results Preview */}
          {showResults && (
            <>
              <DepreciationChart data={depreciationData} />
              <ScenarioResults results={scenarioResults} />

              <div className="flex flex-col gap-2">
                <Button className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button variant="outline" className="w-full">
                  <Calculator className="mr-2 h-4 w-4" />
                  Generar Costo Horario
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
