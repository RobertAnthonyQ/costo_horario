import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Save, Calculator, Table, FormInput } from "lucide-react";
import {
  MachineSelection,
  ScenarioConfiguration,
  Comments,
  IndividualResultsTable,
} from "./components";
import PossessionTable from "./components/PossessionTable";
import { mockTableViewData } from "./models/data";
import {
  Scenario,
  CalculationMachine,
  PossessionVersion,
  TableViewData,
  MachineWithVersion,
  ScenarioCalculationResult,
} from "./models/types";
import {
  possessionService,
  CreateCalculationDto,
} from "./services/possessionService";

export default function PossessionCalculation() {
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 1,
      horasMinimas: 400,
      gradoDeOperatividad: 0.85,
      factorDeMercado: 0.95,
    },
    {
      id: 2,
      horasMinimas: 480,
      gradoDeOperatividad: 0.8,
      factorDeMercado: 0.9,
    },
  ]);
  const [comments, setComments] = useState(
    "Vista previa para análisis preliminar"
  );

  // Estados para resultados individuales
  const [individualResults, setIndividualResults] = useState<
    ScenarioCalculationResult[]
  >([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  // Estados para la vista de tabla
  const [tableData, setTableData] = useState<TableViewData>(mockTableViewData);

  const addScenario = () => {
    const newScenario: Scenario = {
      id: scenarios.length + 1,
      horasMinimas: 400,
      gradoDeOperatividad: 0.8,
      factorDeMercado: 1.0,
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

  // Función para manejar la selección de versión individual
  const handleIndividualVersionSelect = async (versionId: string) => {
    setSelectedVersion(versionId);

    if (versionId === "new" || versionId === "") {
      // Nuevo cálculo - resetear a valores por defecto
      setScenarios([
        {
          id: 1,
          horasMinimas: 400,
          gradoDeOperatividad: 0.85,
          factorDeMercado: 0.95,
        },
        {
          id: 2,
          horasMinimas: 480,
          gradoDeOperatividad: 0.8,
          factorDeMercado: 0.9,
        },
      ]);
      setComments("Vista previa para análisis preliminar");
      setHasResults(false);
      setIndividualResults([]);
    } else {
      // Cargar versión existente desde el backend
      console.log("🚀 Cargando versión específica:", versionId);

      try {
        const response = await possessionService.getPossessionHistoryById(
          parseInt(versionId)
        );

        if (response.success && response.data) {
          const historyData = response.data;
          console.log("✅ Datos del historial cargados:", historyData);

          // Cargar escenarios desde horas_json
          const loadedScenarios: Scenario[] =
            historyData.horas_json.escenarios.map((esc, index) => ({
              id: index + 1,
              horasMinimas: esc.horasMinimas,
              gradoDeOperatividad: esc.gradoDeOperatividad,
              factorDeMercado: esc.factorDeMercado,
            }));

          // Cargar resultados desde resultados_json
          const loadedResults = historyData.resultados_json.escenarios;

          setScenarios(loadedScenarios);
          setComments(historyData.comentario || "Versión cargada");
          setIndividualResults(loadedResults);
          setHasResults(loadedResults.length > 0);
        } else {
          console.error("❌ Error al cargar versión:", response.error);
          // Mantener estado actual en caso de error
        }
      } catch (error) {
        console.error("❌ Error al cargar los detalles de la versión:", error);
      }
    }
  };

  // Función para manejar cambio de máquina
  const handleMachineSelect = (machineId: string) => {
    setSelectedMachine(machineId);
    setSelectedVersion(""); // Resetear versión al cambiar máquina
    setHasResults(false);
    setIndividualResults([]);
  };

  const calculatePossession = async () => {
    if (!selectedMachine) return;

    setIsCalculating(true);
    try {
      console.log("🚀 Calculando posesión...");

      const calculationData: CreateCalculationDto = {
        machine_id: parseInt(selectedMachine),
        horas_json: {
          escenarios: scenarios.map((s) => ({
            horasMinimas: s.horasMinimas,
            gradoDeOperatividad: s.gradoDeOperatividad,
            factorDeMercado: s.factorDeMercado,
          })),
        },
        comentario: comments,
      };

      const response =
        await possessionService.calculatePossessionPreview(calculationData);

      if (response.success && response.data) {
        console.log("✅ Cálculo completado:", response.data);
        setIndividualResults(response.data.resultados.escenarios);
        setHasResults(true);
      } else {
        console.error("❌ Error en el cálculo:", response.error);
        // Mostrar error al usuario
      }
    } catch (error) {
      console.error("❌ Error calculating possession:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const savePossessionCalculation = async () => {
    if (!selectedMachine || !hasResults) return;

    try {
      console.log("💾 Guardando cálculo...");

      const calculationData: CreateCalculationDto = {
        machine_id: parseInt(selectedMachine),
        horas_json: {
          escenarios: scenarios.map((s) => ({
            horasMinimas: s.horasMinimas,
            gradoDeOperatividad: s.gradoDeOperatividad,
            factorDeMercado: s.factorDeMercado,
          })),
        },
        comentario: comments,
      };

      const response =
        await possessionService.calculateAndSavePossession(calculationData);

      if (response.success && response.data) {
        console.log("✅ Cálculo guardado exitosamente:", response.data);
        alert("Cálculo guardado exitosamente!");

        // Actualizar la versión seleccionada al nuevo registro guardado
        setSelectedVersion(response.data.id.toString());
      } else {
        console.error("❌ Error al guardar:", response.error);
        alert(`Error al guardar: ${response.error}`);
      }
    } catch (error) {
      console.error("❌ Error saving calculation:", error);
      alert("Error al guardar el cálculo");
    }
  };

  // Funciones para la vista de tabla (mantenemos las mock por ahora)
  const handleMachineAdd = (machine: CalculationMachine): string => {
    // Generar un instanceId único usando timestamp y machine ID
    const instanceId = `machine-${machine.id}-instance-${Date.now()}`;

    const newMachineData: MachineWithVersion = {
      instanceId,
      machine,
      selectedVersion: undefined,
      results: undefined,
    };

    setTableData((prev) => ({
      ...prev,
      machines: [...prev.machines, newMachineData],
    }));

    return instanceId;
  };

  const handleVersionSelect = async (
    instanceId: string,
    version: PossessionVersion
  ) => {
    // Fase 1: reflejar la selección y limpiar resultados mientras cargan
    setTableData((prev) => ({
      ...prev,
      machines: prev.machines.map((machineData) =>
        machineData.instanceId === instanceId
          ? { ...machineData, selectedVersion: version, results: undefined }
          : machineData
      ),
    }));

    try {
      // Fase 2: cargar detalles completos por ID de historial
      const resp = await possessionService.getPossessionHistoryById(version.id);
      if (resp.success && resp.data) {
        const full = resp.data;
        const loadedResults: ScenarioCalculationResult[] =
          full.resultados_json?.escenarios || [];

        setTableData((prev) => ({
          ...prev,
          machines: prev.machines.map((machineData) =>
            machineData.instanceId === instanceId
              ? { ...machineData, results: loadedResults }
              : machineData
          ),
        }));
      } else {
        console.error(
          "❌ Error obteniendo detalles de la versión:",
          resp.error
        );
      }
    } catch (err) {
      console.error("❌ Error en getPossessionHistoryById:", err);
    }
  };

  const handleRemoveMachine = (instanceId: string) => {
    setTableData((prev) => ({
      ...prev,
      machines: prev.machines.filter(
        (machineData) => machineData.instanceId !== instanceId
      ),
    }));
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

      {/* Tabs for different views */}
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <FormInput className="h-4 w-4" />
            Vista Individual
          </TabsTrigger>
          <TabsTrigger value="comparative" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Vista Comparativa
          </TabsTrigger>
        </TabsList>

        {/* Individual View */}
        <TabsContent value="individual" className="mt-6">
          <div className="space-y-6">
            {/* Form Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Step 1: Machine Selection */}
                <MachineSelection
                  selectedMachine={selectedMachine}
                  onMachineSelect={handleMachineSelect}
                  selectedVersion={selectedVersion}
                  onVersionSelect={handleIndividualVersionSelect}
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
                  <Button
                    variant="outline"
                    onClick={calculatePossession}
                    disabled={!selectedMachine || isCalculating}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    {isCalculating ? "Calculando..." : "Calcular"}
                  </Button>
                  <Button
                    onClick={savePossessionCalculation}
                    disabled={!selectedMachine || !hasResults || isCalculating}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                </div>
              </div>

              {/* Results Section - More space */}
              <div className="lg:col-span-3">
                <IndividualResultsTable
                  machineName={
                    selectedMachine
                      ? `Máquina ${selectedMachine}` // Temporal - se puede mejorar cargando el nombre real
                      : undefined
                  }
                  results={individualResults}
                  isLoading={isCalculating}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Comparative Table View */}
        <TabsContent value="comparative" className="mt-6">
          <PossessionTable
            data={tableData}
            availableVersions={[]} // TODO: Implementar carga de versiones para vista comparativa
            onMachineAdd={handleMachineAdd}
            onVersionSelect={handleVersionSelect}
            onRemoveMachine={handleRemoveMachine}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
