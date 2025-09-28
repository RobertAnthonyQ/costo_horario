import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { machinesService } from "../../../machines/services/machinesService";
import { hourlyCostService } from "../services/hourlyCostService";
import { HourlyCostReportResponse } from "../models/types";
import { ComparisonReportTable } from "./ComparisonReportTable";

export function ComparisonView() {
  const [machines, setMachines] = useState<any[]>([]);
  const [machineId1, setMachineId1] = useState<string>("");
  const [machineId2, setMachineId2] = useState<string>("");
  const [history1, setHistory1] = useState<HourlyCostReportResponse[]>([]);
  const [history2, setHistory2] = useState<HourlyCostReportResponse[]>([]);
  const [selectedReportId1, setSelectedReportId1] = useState<string>("");
  const [selectedReportId2, setSelectedReportId2] = useState<string>("");
  const [report1, setReport1] = useState<HourlyCostReportResponse | null>(null);
  const [report2, setReport2] = useState<HourlyCostReportResponse | null>(null);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [loadingHistory1, setLoadingHistory1] = useState(false);
  const [loadingHistory2, setLoadingHistory2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMachine1 = useMemo(
    () => machines.find((m) => m.id.toString() === machineId1),
    [machines, machineId1]
  );

  const selectedMachine2 = useMemo(
    () => machines.find((m) => m.id.toString() === machineId2),
    [machines, machineId2]
  );

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

  // Cargar historial cuando se selecciona una máquina
  useEffect(() => {
    const loadHistory = async () => {
      if (!machineId1) {
        setHistory1([]);
        setSelectedReportId1("");
        setReport1(null);
        return;
      }

      setLoadingHistory1(true);
      try {
        const res = await hourlyCostService.getHistoryByMachine(
          parseInt(machineId1)
        );
        if (res.success && res.data && res.data.length > 0) {
          const sortedHistory = res.data.sort(
            (a, b) =>
              new Date(b.fecha_calculo).getTime() -
              new Date(a.fecha_calculo).getTime()
          );
          setHistory1(sortedHistory);
          // Auto-seleccionar el más reciente
          const latestId = sortedHistory[0].id.toString();
          setSelectedReportId1(latestId);
          setReport1(sortedHistory[0]);
        } else {
          setHistory1([]);
          setSelectedReportId1("");
          setReport1(null);
        }
      } catch (error) {
        console.error("Error cargando historial máquina 1:", error);
        setHistory1([]);
        setSelectedReportId1("");
        setReport1(null);
      }
      setLoadingHistory1(false);
    };
    loadHistory();
  }, [machineId1]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!machineId2) {
        setHistory2([]);
        setSelectedReportId2("");
        setReport2(null);
        return;
      }

      setLoadingHistory2(true);
      try {
        const res = await hourlyCostService.getHistoryByMachine(
          parseInt(machineId2)
        );
        if (res.success && res.data && res.data.length > 0) {
          const sortedHistory = res.data.sort(
            (a, b) =>
              new Date(b.fecha_calculo).getTime() -
              new Date(a.fecha_calculo).getTime()
          );
          setHistory2(sortedHistory);
          // Auto-seleccionar el más reciente
          const latestId = sortedHistory[0].id.toString();
          setSelectedReportId2(latestId);
          setReport2(sortedHistory[0]);
        } else {
          setHistory2([]);
          setSelectedReportId2("");
          setReport2(null);
        }
      } catch (error) {
        console.error("Error cargando historial máquina 2:", error);
        setHistory2([]);
        setSelectedReportId2("");
        setReport2(null);
      }
      setLoadingHistory2(false);
    };
    loadHistory();
  }, [machineId2]);

  // Actualizar reporte cuando se cambia la selección de versión
  useEffect(() => {
    if (selectedReportId1 && history1.length > 0) {
      const selected = history1.find(
        (h) => h.id.toString() === selectedReportId1
      );
      setReport1(selected || null);
    }
  }, [selectedReportId1, history1]);

  useEffect(() => {
    if (selectedReportId2 && history2.length > 0) {
      const selected = history2.find(
        (h) => h.id.toString() === selectedReportId2
      );
      setReport2(selected || null);
    }
  }, [selectedReportId2, history2]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comparativo de Costo Horario</h1>
        <p className="text-muted-foreground">
          Compara los costos horarios de dos máquinas lado a lado usando su
          historial más reciente.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Selección simple de máquinas */}
      <Card>
        <CardHeader>
          <CardTitle>Selección de Máquinas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selector Máquina 1 */}
            <div className="space-y-3">
              <Label className="text-blue-700 font-semibold">Máquina 1</Label>

              {/* Selector de Máquina */}
              <select
                className="w-full border border-blue-200 rounded-md h-10 px-3 bg-blue-50/30"
                value={machineId1}
                onChange={(e) => setMachineId1(e.target.value)}
                disabled={loadingMachines}
              >
                <option value="" disabled>
                  {loadingMachines
                    ? "Cargando máquinas..."
                    : "Seleccionar máquina"}
                </option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id_equipo_interno || `Máquina ${m.id}`} -{" "}
                    {m?.modelo?.nombre}
                  </option>
                ))}
              </select>

              {/* Selector de Versión */}
              {machineId1 && (
                <div className="space-y-2">
                  <Label className="text-blue-600 text-sm">
                    Versión del Historial
                  </Label>
                  <select
                    className="w-full border border-blue-300 rounded-md h-10 px-3 bg-blue-25/20"
                    value={selectedReportId1}
                    onChange={(e) => setSelectedReportId1(e.target.value)}
                    disabled={loadingHistory1}
                  >
                    <option value="" disabled>
                      {loadingHistory1
                        ? "Cargando historial..."
                        : "Seleccionar versión"}
                    </option>
                    {history1.map((report, index) => (
                      <option key={report.id} value={report.id}>
                        {index === 0 ? "🔹 " : ""}
                        {new Date(report.fecha_calculo).toLocaleString("es-ES")}
                        {index === 0 ? " (Más reciente)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedMachine1 && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  <div className="font-medium">
                    {selectedMachine1.id_equipo_interno}
                  </div>
                  <div>
                    {selectedMachine1?.modelo?.marca?.nombre} •{" "}
                    {selectedMachine1?.modelo?.nombre}
                  </div>
                  {report1 && (
                    <div className="mt-1">
                      ✓ Usando historial del{" "}
                      {new Date(report1.fecha_calculo).toLocaleString("es-ES")}
                    </div>
                  )}
                  {history1.length > 0 && (
                    <div className="mt-1 text-muted-foreground">
                      {history1.length} versión
                      {history1.length !== 1 ? "es" : ""} disponible
                      {history1.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selector Máquina 2 */}
            <div className="space-y-3">
              <Label className="text-red-700 font-semibold">Máquina 2</Label>

              {/* Selector de Máquina */}
              <select
                className="w-full border border-red-200 rounded-md h-10 px-3 bg-red-50/30"
                value={machineId2}
                onChange={(e) => setMachineId2(e.target.value)}
                disabled={loadingMachines}
              >
                <option value="" disabled>
                  {loadingMachines
                    ? "Cargando máquinas..."
                    : "Seleccionar máquina"}
                </option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id_equipo_interno || `Máquina ${m.id}`} -{" "}
                    {m?.modelo?.nombre}
                  </option>
                ))}
              </select>

              {/* Selector de Versión */}
              {machineId2 && (
                <div className="space-y-2">
                  <Label className="text-red-600 text-sm">
                    Versión del Historial
                  </Label>
                  <select
                    className="w-full border border-red-300 rounded-md h-10 px-3 bg-red-25/20"
                    value={selectedReportId2}
                    onChange={(e) => setSelectedReportId2(e.target.value)}
                    disabled={loadingHistory2}
                  >
                    <option value="" disabled>
                      {loadingHistory2
                        ? "Cargando historial..."
                        : "Seleccionar versión"}
                    </option>
                    {history2.map((report, index) => (
                      <option key={report.id} value={report.id}>
                        {index === 0 ? "🔹 " : ""}
                        {new Date(report.fecha_calculo).toLocaleString("es-ES")}
                        {index === 0 ? " (Más reciente)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedMachine2 && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  <div className="font-medium">
                    {selectedMachine2.id_equipo_interno}
                  </div>
                  <div>
                    {selectedMachine2?.modelo?.marca?.nombre} •{" "}
                    {selectedMachine2?.modelo?.nombre}
                  </div>
                  {report2 && (
                    <div className="mt-1">
                      ✓ Usando historial del{" "}
                      {new Date(report2.fecha_calculo).toLocaleString("es-ES")}
                    </div>
                  )}
                  {history2.length > 0 && (
                    <div className="mt-1 text-muted-foreground">
                      {history2.length} versión
                      {history2.length !== 1 ? "es" : ""} disponible
                      {history2.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla comparativa directa */}
      {report1 && report2 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparación de Costos Horarios</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonReportTable report1={report1} report2={report2} />
          </CardContent>
        </Card>
      )}

      {/* Estado cuando no hay suficientes datos */}
      {(machineId1 || machineId2) && (!report1 || !report2) && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {!machineId1 || !machineId2 ? (
                <div>
                  <div className="text-lg font-medium mb-2">
                    Selecciona ambas máquinas
                  </div>
                  <div>
                    Para ver la comparación, selecciona una máquina y versión en
                    cada selector arriba.
                  </div>
                </div>
              ) : !selectedReportId1 || !selectedReportId2 ? (
                <div>
                  <div className="text-lg font-medium mb-2">
                    Selecciona las versiones
                  </div>
                  <div>
                    Elige qué versión del historial quieres comparar para cada
                    máquina.
                  </div>
                </div>
              ) : loadingHistory1 || loadingHistory2 ? (
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando historial de las máquinas...
                  </div>
                  <div className="text-sm">
                    Preparando los datos para la comparación...
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-lg font-medium mb-2">
                    No hay datos disponibles
                  </div>
                  <div className="text-sm">
                    Una o ambas máquinas no tienen historial de cálculos.
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
