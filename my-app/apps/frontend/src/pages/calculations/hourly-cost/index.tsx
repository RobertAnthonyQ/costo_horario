import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { machinesService } from "../../machines/services/machinesService";
import { hourlyCostService } from "./services/hourlyCostService";
import { HourlyCostInput, HourlyCostReportResponse } from "./models/types";
import { ParametersForm, HistorySection, ReportDisplay } from "./components";

export default function HourlyCostReport() {
  const [machines, setMachines] = useState<any[]>([]);
  const [machineId, setMachineId] = useState<string>("");
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<HourlyCostReportResponse | null>(null);
  const [history, setHistory] = useState<HourlyCostReportResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [posesionId, setPosesionId] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string }>(
    {}
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
        return;
      }
      setHistoryLoading(true);
      const res = await hourlyCostService.getHistoryByMachine(
        parseInt(machineId)
      );
      if (res.success && res.data) {
        setHistory(res.data);
      } else {
        setHistory([]);
      }
      setHistoryLoading(false);
    };
    loadHistory();
  }, [machineId]);

  const selectedMachine = useMemo(
    () => machines.find((m) => m.id.toString() === machineId),
    [machines, machineId]
  );

  const buildPayload = (): HourlyCostInput => ({
    machineId: parseInt(machineId),
    posesionId: posesionId ? parseInt(posesionId) : undefined,
    mesesPorAnio: params.mesesPorAnio,
    tasaFinanciamiento: params.tasaFinanciamiento,
    aniosFinanciamiento: params.aniosFinanciamiento,
    tasaSeguro: params.tasaSeguro,
    aniosSeguro: params.aniosSeguro,
    comentario: params.comentario,
    usuarioId: undefined,
    incluyeGastosDistribuibles: params.incluyeGastosDistribuibles,
    costoMCorrMayores: params.costoMCorrMayores,
  });

  const onPreview = async () => {
    if (!machineId) {
      setError("Selecciona una máquina");
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await hourlyCostService.previewReport(buildPayload());
    if (res.success && res.data) {
      setReport(res.data);
    } else {
      setError(res.error || "No se pudo generar el informe");
    }
    setSubmitting(false);
  };

  const onSave = async () => {
    if (!machineId) {
      setError("Selecciona una máquina");
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await hourlyCostService.createReport(buildPayload());
    if (res.success && res.data) {
      setReport(res.data);
      // refrescar historial
      const h = await hourlyCostService.getHistoryByMachine(
        parseInt(machineId)
      );
      if (h.success && h.data) setHistory(h.data);
      setShowReportModal(true);
    } else {
      setError(res.error || "No se pudo guardar el informe");
    }
    setSubmitting(false);
  };

  const handleReportSelect = (selectedReport: HourlyCostReportResponse) => {
    setReport(selectedReport);
    setShowReportModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Informe Costo Horario</h1>
        <p className="text-muted-foreground">
          Genera el informe a partir de una máquina y parámetros base.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ParametersForm
        machines={machines}
        machineId={machineId}
        posesionId={posesionId}
        params={params}
        loadingMachines={loadingMachines}
        submitting={submitting}
        onMachineChange={setMachineId}
        onPosesionIdChange={setPosesionId}
        onParamsChange={setParams}
        onPreview={onPreview}
        onSave={onSave}
      />

      <HistorySection
        machineId={machineId}
        history={history}
        historyLoading={historyLoading}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onReportSelect={handleReportSelect}
      />

      <ReportDisplay
        report={report}
        selectedMachine={selectedMachine}
        showReportModal={showReportModal}
        onCloseModal={() => setShowReportModal(false)}
      />
    </div>
  );
}
