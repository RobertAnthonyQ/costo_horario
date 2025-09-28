import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calculator, BarChart3 } from "lucide-react";
import { machinesService } from "../../machines/services/machinesService";
import { hourlyCostService } from "./services/hourlyCostService";
import {
  HourlyCostInput,
  HourlyCostReportResponse,
  PosesionVersion,
} from "./models/types";
import { ParametersForm, ReportDisplay, ComparisonView } from "./components";

export default function HourlyCostReport() {
  const [activeView, setActiveView] = useState<"individual" | "comparison">(
    "individual"
  );
  const [machines, setMachines] = useState<any[]>([]);
  const [machineId, setMachineId] = useState<string>("");
  const [selectedHistoryReport, setSelectedHistoryReport] =
    useState<HourlyCostReportResponse | null>(null);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatingPreview, setCalculatingPreview] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [report, setReport] = useState<HourlyCostReportResponse | null>(null);
  const [history, setHistory] = useState<HourlyCostReportResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [posesionId, setPosesionId] = useState<string>("");
  const [posesionVersions, setPosesionVersions] = useState<PosesionVersion[]>(
    []
  );

  const [showReportModal, setShowReportModal] = useState(false);

  // Parámetros simples por defecto (alineados con ejemplo)
  const [params, setParams] = useState({
    mesesPorAnio: 12,
    tasaFinanciamiento: 0.09,
    aniosFinanciamiento: 3,
    tasaSeguro: 0.01,
    aniosSeguro: 1,
    incluyeGastosDistribuibles: false,
    costoMCorrMayores: 0.9,
    mano_de_obra_tecnico: 8.8,
    comentario: "Cálculo preliminar informe costo horario",
  });

  useEffect(() => {
    const load = async () => {
      setLoadingMachines(true);
      const res = await machinesService.getAllMachines();
      if (res.success && res.data) {
        setMachines(res.data);
      } else {
        setError(res.error || "No se pudieron cargar las máquinas");
      }
      setLoadingMachines(false);
    };
    load();
  }, []);

  // cargar historial cuando seleccionan una máquina
  useEffect(() => {
    const loadHistory = async () => {
      if (!machineId) {
        setHistory([]);
        setSelectedHistoryReport(null);
        setPosesionId("");
        setPosesionVersions([]);
        return;
      }
      setHistoryLoading(true);
      const [resHistory, resPos] = await Promise.all([
        hourlyCostService.getHistoryByMachine(parseInt(machineId)),
        hourlyCostService.getVersionsByMachine(parseInt(machineId)),
      ]);

      if (resHistory.success && resHistory.data) {
        setHistory(resHistory.data);
      } else {
        setHistory([]);
      }

      if (resPos.success && resPos.data) {
        const versions = resPos.data;
        setPosesionVersions(versions);
        // Elegir la versión más reciente por fecha_calculo
        const latest = [...versions].sort(
          (a, b) =>
            new Date(b.fecha_calculo).getTime() -
            new Date(a.fecha_calculo).getTime()
        )[0];
        if (latest) {
          setPosesionId(String(latest.id));
        } else {
          setPosesionId("");
        }
      } else {
        setPosesionVersions([]);
        setPosesionId("");
      }
      setHistoryLoading(false);
    };
    loadHistory();
  }, [machineId]);

  const selectedMachine = useMemo(
    () => machines.find((m) => m.id.toString() === machineId),
    [machines, machineId]
  );

  const handleHistorySelect = (historyReport: HourlyCostReportResponse) => {
    setSelectedHistoryReport(historyReport);

    // Obtener posesionId de los parámetros o usar el machine_id como fallback
    const posesionIdFromParametros =
      historyReport.resultado_completo_json?.parametros?.posesionId;

    // Usar el posesionId de los parámetros, o como fallback usar 1 (valor por defecto)
    const posesionIdToUse = posesionIdFromParametros || 1;
    setPosesionId(posesionIdToUse.toString());

    // Obtener todos los parámetros del resultado_completo_json si están disponibles
    const parametrosFromJson =
      historyReport.resultado_completo_json?.parametros;

    // Cargar los parámetros del historial seleccionado (priorizando los del JSON)
    setParams({
      mesesPorAnio:
        parametrosFromJson?.mesesPorAnio || historyReport.mes_por_anio || 12,
      tasaFinanciamiento:
        parametrosFromJson?.tasaFinanciamiento ||
        historyReport.tasa_financiamiento_usada ||
        0.09,
      aniosFinanciamiento:
        parametrosFromJson?.aniosFinanciamiento ||
        historyReport.anios_financiamiento ||
        3,
      tasaSeguro:
        parametrosFromJson?.tasaSeguro ||
        historyReport.tasa_seguro_usada ||
        0.01,
      aniosSeguro:
        parametrosFromJson?.aniosSeguro || historyReport.anios_seguro || 1,
      incluyeGastosDistribuibles:
        parametrosFromJson?.incluyeGastosDistribuibles || false,
      costoMCorrMayores: parametrosFromJson?.costoMCorrMayores || 0.9, // Valor por defecto
      mano_de_obra_tecnico: parametrosFromJson?.mano_de_obra_tecnico || 8.8, // Valor por defecto
      comentario:
        parametrosFromJson?.comentario ||
        historyReport.resultado_completo_json?.comentario ||
        "Cálculo basado en historial",
    });
  };

  const buildPayload = (): HourlyCostInput => {
    const payload = {
      machineId: parseInt(machineId),
      posesionId: posesionId ? parseInt(posesionId) : undefined,
      mesesPorAnio: params.mesesPorAnio,
      tasaFinanciamiento: params.tasaFinanciamiento,
      aniosFinanciamiento: params.aniosFinanciamiento,
      tasaSeguro: params.tasaSeguro,
      aniosSeguro: params.aniosSeguro,
      comentario: params.comentario,
      usuarioId: "user-uuid", // Agregar un usuarioId por defecto
      incluyeGastosDistribuibles: params.incluyeGastosDistribuibles,
      costoMCorrMayores: params.costoMCorrMayores,
      mano_de_obra_tecnico: params.mano_de_obra_tecnico,
    };

    console.log("🚀 Payload enviado:", payload);
    return payload;
  };

  const onPreview = async () => {
    console.log("🧮 Iniciando cálculo preview...");
    if (!machineId) {
      setError("Selecciona una máquina");
      return;
    }
    setError(null);
    setCalculatingPreview(true);

    try {
      const payload = buildPayload();
      console.log("📤 Enviando payload para preview:", payload);
      const res = await hourlyCostService.previewReport(payload);
      console.log("📥 Respuesta del preview:", res);

      if (res.success && res.data) {
        // Para preview, los datos vienen directamente con la estructura de cálculo
        const previewData = {
          ...res.data,
          fecha_calculo: new Date().toISOString(),
          machine: res.data.machine,
        } as HourlyCostReportResponse;

        setReport(previewData);
        setShowReportModal(true);
        console.log("✅ Preview exitoso, modal abierto");
      } else {
        console.error("❌ Error en preview:", res.error);
        setError(res.error || "No se pudo generar el informe");
      }
    } catch (error) {
      console.error("💥 Error inesperado en preview:", error);
      setError("Error inesperado al calcular el informe");
    }

    setCalculatingPreview(false);
  };

  const onSave = async () => {
    console.log("💾 Iniciando cálculo y guardado...");
    if (!machineId) {
      setError("Selecciona una máquina");
      return;
    }
    setError(null);
    setSavingReport(true);

    try {
      const payload = buildPayload();
      console.log("📤 Enviando payload para guardar:", payload);
      const res = await hourlyCostService.createReport(payload);
      console.log("📥 Respuesta del guardado:", res);

      if (res.success && res.data) {
        setReport(res.data);
        // refrescar historial
        const h = await hourlyCostService.getHistoryByMachine(
          parseInt(machineId)
        );
        if (h.success && h.data) setHistory(h.data);
        setShowReportModal(true);
        console.log("✅ Guardado exitoso, modal abierto");
      } else {
        console.error("❌ Error al guardar:", res.error);
        setError(res.error || "No se pudo guardar el informe");
      }
    } catch (error) {
      console.error("💥 Error inesperado al guardar:", error);
      setError("Error inesperado al guardar el informe");
    }

    setSavingReport(false);
  };

  const handleViewHistoryDetails = (
    historyReport: HourlyCostReportResponse
  ) => {
    setReport(historyReport);
    setShowReportModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Informe Costo Horario</h1>
        <p className="text-muted-foreground">
          Genera informes individuales o comparativos de costo horario entre
          máquinas.
        </p>
      </div>

      {/* Navegación entre vistas */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeView === "individual" ? "default" : "ghost"}
          onClick={() => setActiveView("individual")}
          className="rounded-b-none"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Cálculo Individual
        </Button>
        <Button
          variant={activeView === "comparison" ? "default" : "ghost"}
          onClick={() => setActiveView("comparison")}
          className="rounded-b-none"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Vista Comparativa
        </Button>
      </div>

      {/* Vista Individual */}
      {activeView === "individual" && (
        <>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ParametersForm
            machines={machines}
            machineId={machineId}
            history={history}
            selectedHistoryReport={selectedHistoryReport}
            posesionId={posesionId}
            params={params}
            loadingMachines={loadingMachines}
            historyLoading={historyLoading}
            calculatingPreview={calculatingPreview}
            savingReport={savingReport}
            onMachineChange={setMachineId}
            onHistorySelect={handleHistorySelect}
            onPosesionIdChange={setPosesionId}
            onParamsChange={setParams}
            onPreview={onPreview}
            onSave={onSave}
            onViewHistoryDetails={handleViewHistoryDetails}
          />

          <ReportDisplay
            report={report}
            selectedMachine={selectedMachine}
            showReportModal={showReportModal}
            onCloseModal={() => setShowReportModal(false)}
          />
        </>
      )}

      {/* Vista Comparativa */}
      {activeView === "comparison" && <ComparisonView />}
    </div>
  );
}
