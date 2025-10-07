import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DollarSign, Eye, Calculator, Save } from "lucide-react";
import { machinesService } from "../../machines/services/machinesService";
import { flujoCajaService } from "./services/flujoCajaService";
import {
  FlujoCajaInput,
  FlujoCajaResponse,
  FlujoCajaVersion,
} from "./models/types";
import { ParametersForm, ReportDisplay, HistorySection } from "./components";

export default function CashFlowAnalysis() {
  const [machines, setMachines] = useState<any[]>([]);
  const [machineId, setMachineId] = useState<string>("");
  const [versions, setVersions] = useState<FlujoCajaVersion[]>([]);
  const [selectedVersion, setSelectedVersion] =
    useState<FlujoCajaVersion | null>(null);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatingPreview, setCalculatingPreview] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [report, setReport] = useState<FlujoCajaResponse | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Debug: Monitor modal state changes
  useEffect(() => {
    console.log(
      "🔄 showReportModal changed to:",
      showReportModal,
      "report:",
      !!report
    );
  }, [showReportModal, report]);

  // Helper function to open modal safely
  const openReportModal = (reportData: FlujoCajaResponse) => {
    console.log("🎯 Opening modal with report:", reportData);
    setReport(reportData);
    // Use setTimeout to ensure state update is processed
    setTimeout(() => {
      setShowReportModal(true);
      console.log("🔄 Modal should be open now");
    }, 100);
  };

  // Parámetros por defecto
  const [params, setParams] = useState({
    porcentajeResidual: 0.1, // 10%
    margenInterno: 0.05, // 5%
    gastosGeneralesMantenimiento: 0.05, // 5%
    horasOperativasMes: 300,
    tasaDescuentoEmpresa: 0.08, // 8%
    comentario: "Análisis de flujo de caja",
  });

  // Cargar máquinas al inicio
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

  // Cargar versiones cuando se selecciona una máquina
  useEffect(() => {
    const loadVersions = async () => {
      if (!machineId) {
        setVersions([]);
        setSelectedVersion(null);
        return;
      }
      setVersionsLoading(true);
      const res = await flujoCajaService.getVersiones(parseInt(machineId));

      if (res.success && res.data) {
        setVersions(res.data);
      } else {
        setVersions([]);
      }
      setVersionsLoading(false);
    };
    loadVersions();
  }, [machineId]);

  const selectedMachine = useMemo(
    () => machines.find((m) => m.id.toString() === machineId),
    [machines, machineId]
  );

  const handleVersionSelect = async (version: FlujoCajaVersion) => {
    setSelectedVersion(version);

    // Cargar los detalles de la versión seleccionada
    const res = await flujoCajaService.getAnalisisById(version.id);
    if (res.success && res.data) {
      console.log("📦 Datos de versión cargados:", res.data);

      // Cargar los parámetros de esta versión con validación segura
      if (res.data.parametros) {
        const newParams = {
          porcentajeResidual: res.data.parametros.porcentajeResidual || 0.1,
          margenInterno: res.data.parametros.margenInterno || 0.05,
          gastosGeneralesMantenimiento:
            res.data.parametros.gastosGeneralesMantenimiento || 0,
          horasOperativasMes: res.data.parametros.horasOperativasMes || 300,
          tasaDescuentoEmpresa:
            res.data.parametros.tasaDescuentoEmpresa || 0.08,
          comentario:
            res.data.parametros.comentario || "Análisis de flujo de caja",
        };
        console.log("📋 Parámetros cargados desde versión:", newParams);
        setParams(newParams);
      }
    }
  };

  const buildPayload = (): FlujoCajaInput => {
    // Validar y sanitizar los datos antes de enviarlos
    const payload = {
      machineId: parseInt(machineId),
      porcentajeResidual: Number(params.porcentajeResidual) || 0,
      margenInterno: Number(params.margenInterno) || 0,
      gastosGeneralesMantenimiento:
        Number(params.gastosGeneralesMantenimiento) || 0,
      horasOperativasMes: Math.floor(Number(params.horasOperativasMes)) || 300,
      tasaDescuentoEmpresa: Number(params.tasaDescuentoEmpresa) || 0.08,
      comentario: params.comentario || "Análisis de flujo de caja",
      usuarioId: "user-uuid", // TODO: Obtener del contexto de autenticación
    };

    console.log("🚀 Payload enviado:", payload);

    // Validaciones adicionales
    if (isNaN(payload.machineId)) {
      throw new Error("ID de máquina no válido");
    }
    if (payload.horasOperativasMes <= 0) {
      throw new Error("Las horas operativas deben ser mayor a 0");
    }
    if (payload.porcentajeResidual < 0 || payload.porcentajeResidual > 1) {
      throw new Error("El porcentaje residual debe estar entre 0% y 100%");
    }
    if (payload.tasaDescuentoEmpresa <= 0) {
      throw new Error("La tasa de descuento debe ser mayor a 0%");
    }

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
      const res = await flujoCajaService.previewAnalisis(payload);
      console.log("📥 Respuesta del preview:", res);

      if (res.success && res.data) {
        console.log("✅ Preview exitoso, datos recibidos:", res.data);
        openReportModal(res.data);
      } else {
        console.error("❌ Error en preview:", res.error);
        const errorMsg = res.error || "No se pudo generar el análisis";
        setError(`Error en el cálculo: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error("💥 Error inesperado en preview:", error);
      const errorMsg =
        error.message || "Error inesperado al calcular el análisis";
      setError(`Error de validación: ${errorMsg}`);
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
      const res = await flujoCajaService.guardarAnalisis(payload);
      console.log("📥 Respuesta del guardado:", res);

      if (res.success && res.data) {
        console.log("✅ Guardado exitoso, datos recibidos:", res.data);
        // Refrescar versiones
        const versionsRes = await flujoCajaService.getVersiones(
          parseInt(machineId)
        );
        if (versionsRes.success && versionsRes.data) {
          setVersions(versionsRes.data);
        }
        openReportModal(res.data);
      } else {
        console.error("❌ Error al guardar:", res.error);
        const errorMsg = res.error || "No se pudo guardar el análisis";
        setError(`Error al guardar: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error("💥 Error inesperado al guardar:", error);
      const errorMsg =
        error.message || "Error inesperado al guardar el análisis";
      setError(`Error de validación: ${errorMsg}`);
    }

    setSavingReport(false);
  };

  const handleViewVersionDetails = async (version: FlujoCajaVersion) => {
    const res = await flujoCajaService.getAnalisisById(version.id);
    if (res.success && res.data) {
      openReportModal(res.data);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-7 w-7" />
          Análisis de Flujo de Caja
        </h1>
        <p className="text-muted-foreground">
          Genera análisis financiero de flujo de caja para evaluar la viabilidad
          de inversión en maquinaria.
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
        versions={versions}
        selectedVersion={selectedVersion}
        params={params}
        loadingMachines={loadingMachines}
        versionsLoading={versionsLoading}
        calculatingPreview={calculatingPreview}
        savingReport={savingReport}
        showHistory={showHistory}
        onMachineChange={setMachineId}
        onVersionSelect={handleVersionSelect}
        onParamsChange={setParams}
        onPreview={onPreview}
        onSave={onSave}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onViewVersionDetails={handleViewVersionDetails}
      />

      {/* Historial de versiones - solo se muestra si showHistory es true */}
      {machineId && showHistory && (
        <HistorySection
          versions={versions}
          versionsLoading={versionsLoading}
          onViewDetails={handleViewVersionDetails}
        />
      )}

      <ReportDisplay
        report={report}
        selectedMachine={selectedMachine}
        showReportModal={showReportModal}
        onCloseModal={() => setShowReportModal(false)}
      />
    </div>
  );
}
