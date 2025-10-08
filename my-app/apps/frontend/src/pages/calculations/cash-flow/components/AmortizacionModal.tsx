import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download } from "lucide-react";
import { flujoCajaService } from "../services/flujoCajaService";

interface AmortizacionModalProps {
  open: boolean;
  onClose: () => void;
  machineId?: number;
  flujoHistorialId?: number;
}

interface FilaMensual {
  mes: number;
  cuota: number;
  capital: number;
  interes: number;
  saldo: number;
}

interface FilaAnual {
  anio: number;
  capital: number;
  interes: number;
  total: number;
  saldo: number;
}

interface ParametrosAmortizacion {
  capital: number;
  tasaAnual: number;
  tasaMensual: number;
  mesesPorAnio: number;
  aniosFinanciamiento: number;
  totalPeriodos: number;
  cuotaMensual: number;
}

export function AmortizacionModal({
  open,
  onClose,
  machineId,
  flujoHistorialId,
}: AmortizacionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parametros, setParametros] = useState<ParametrosAmortizacion | null>(
    null
  );
  const [tablaMensual, setTablaMensual] = useState<FilaMensual[]>([]);
  const [tablaAnual, setTablaAnual] = useState<FilaAnual[]>([]);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchParametros();
    } else {
      // Limpiar estado al cerrar
      setParametros(null);
      setTablaMensual([]);
      setTablaAnual([]);
      setError(null);
      setMetadata(null);
    }
  }, [open, machineId, flujoHistorialId]);

  const fetchParametros = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;

      if (flujoHistorialId) {
        // Endpoint 2: Parámetros de reporte guardado
        result =
          await flujoCajaService.getParametrosAmortizacionReporte(
            flujoHistorialId
          );
      } else if (machineId) {
        // Endpoint 1: Parámetros de máquina
        result = await flujoCajaService.getParametrosAmortizacion(machineId);
      } else {
        setError("No se proporcionó machineId ni flujoHistorialId");
        setLoading(false);
        return;
      }

      if (!result.success || !result.data) {
        setError(result.error || "Error al obtener parámetros");
        setLoading(false);
        return;
      }

      const data = result.data;

      // Verificar si hay financiamiento
      if (data.sinFinanciamiento) {
        setError(data.mensaje || "No hay datos de financiamiento disponibles");
        setLoading(false);
        return;
      }

      // Guardar metadata
      setMetadata({
        machine: data.machine || data.flujoHistorial?.machine,
        informeOrigen: data.informeOrigen || data.informeOrigenUsado,
        flujoHistorial: data.flujoHistorial,
        formulasExcel: data.formulasExcel,
      });

      // Construir tablas
      const params = data.parametrosAmortizacion;
      setParametros(params);
      construirTablas(params);
    } catch (err: any) {
      console.error("Error fetching parametros:", err);
      setError(err.message || "Error al obtener parámetros");
    } finally {
      setLoading(false);
    }
  };

  const construirTablas = (params: ParametrosAmortizacion) => {
    // Construir tabla mensual
    const mensual: FilaMensual[] = [];
    let saldo = params.capital;

    for (let mes = 1; mes <= params.totalPeriodos; mes++) {
      const interes = saldo * params.tasaMensual;
      const capital = params.cuotaMensual - interes;
      saldo -= capital;

      mensual.push({
        mes,
        cuota: params.cuotaMensual,
        capital: Number(capital.toFixed(2)),
        interes: Number(interes.toFixed(2)),
        saldo: mes === params.totalPeriodos ? 0 : Number(saldo.toFixed(2)),
      });
    }

    setTablaMensual(mensual);

    // Construir tabla anual
    const anual: FilaAnual[] = [];
    for (let anio = 1; anio <= params.aniosFinanciamiento; anio++) {
      const inicio = (anio - 1) * params.mesesPorAnio;
      const fin = anio * params.mesesPorAnio;
      const mesesDelAnio = mensual.slice(inicio, fin);

      const capitalAnual = mesesDelAnio.reduce((sum, m) => sum + m.capital, 0);
      const interesAnual = mesesDelAnio.reduce((sum, m) => sum + m.interes, 0);

      anual.push({
        anio,
        capital: Number(capitalAnual.toFixed(2)),
        interes: Number(interesAnual.toFixed(2)),
        total: Number((capitalAnual + interesAnual).toFixed(2)),
        saldo: mesesDelAnio[mesesDelAnio.length - 1].saldo,
      });
    }

    setTablaAnual(anual);
  };

  const exportToCSV = (tipo: "mensual" | "anual") => {
    const data = tipo === "mensual" ? tablaMensual : tablaAnual;
    const headers =
      tipo === "mensual"
        ? ["Mes", "Cuota", "Capital", "Interés", "Saldo"]
        : ["Año", "Capital", "Interés", "Total", "Saldo"];

    const csvContent = [
      headers.join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amortizacion_${tipo}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Tabla de Amortización</DialogTitle>
          <DialogDescription className="mt-2">
            {metadata?.machine && (
              <div className="space-y-1">
                <p className="text-sm">
                  <strong>Máquina:</strong> {metadata.machine.marca}{" "}
                  {metadata.machine.modelo}
                  {metadata.machine.idEquipo && (
                    <span> ({metadata.machine.idEquipo})</span>
                  )}
                </p>
                {metadata.informeOrigen && (
                  <p className="text-sm">
                    <strong>Informe Origen:</strong> #
                    {metadata.informeOrigen.id} -{" "}
                    {new Date(
                      metadata.informeOrigen.fechaCalculo
                    ).toLocaleDateString()}
                  </p>
                )}
                {metadata.flujoHistorial && (
                  <p className="text-sm text-blue-600">
                    ⚡ Basado en análisis guardado #{metadata.flujoHistorial.id}
                  </p>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Calculando tabla de amortización...</span>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {parametros && !loading && !error && (
          <div className="space-y-4">
            {/* Resumen de parámetros */}
            <div className="bg-muted/50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Capital</p>
                <p className="text-lg font-semibold">
                  ${parametros.capital.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasa Anual</p>
                <p className="text-lg font-semibold">
                  {(parametros.tasaAnual * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Años Financiamiento
                </p>
                <p className="text-lg font-semibold">
                  {parametros.aniosFinanciamiento} años
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cuota Mensual</p>
                <p className="text-lg font-semibold">
                  ${parametros.cuotaMensual.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Tabs con tablas */}
            <Tabs defaultValue="anual" className="w-full">
              <div className="flex items-center justify-between mb-2">
                <TabsList>
                  <TabsTrigger value="anual">Vista Anual</TabsTrigger>
                  <TabsTrigger value="mensual">Vista Mensual</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="mensual" className="space-y-2">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV("mensual")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-left font-medium">Mes</th>
                          <th className="p-2 text-right font-medium">Cuota</th>
                          <th className="p-2 text-right font-medium">
                            Capital
                          </th>
                          <th className="p-2 text-right font-medium">
                            Interés
                          </th>
                          <th className="p-2 text-right font-medium">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tablaMensual.map((fila) => (
                          <tr
                            key={fila.mes}
                            className="border-t hover:bg-muted/50"
                          >
                            <td className="p-2">{fila.mes}</td>
                            <td className="p-2 text-right">
                              ${fila.cuota.toLocaleString()}
                            </td>
                            <td className="p-2 text-right">
                              ${fila.capital.toLocaleString()}
                            </td>
                            <td className="p-2 text-right">
                              ${fila.interes.toLocaleString()}
                            </td>
                            <td className="p-2 text-right font-medium">
                              ${fila.saldo.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted font-semibold sticky bottom-0">
                        <tr>
                          <td className="p-2">TOTAL</td>
                          <td className="p-2 text-right">
                            $
                            {tablaMensual
                              .reduce((sum, f) => sum + f.cuota, 0)
                              .toLocaleString()}
                          </td>
                          <td className="p-2 text-right">
                            $
                            {tablaMensual
                              .reduce((sum, f) => sum + f.capital, 0)
                              .toLocaleString()}
                          </td>
                          <td className="p-2 text-right">
                            $
                            {tablaMensual
                              .reduce((sum, f) => sum + f.interes, 0)
                              .toLocaleString()}
                          </td>
                          <td className="p-2 text-right">-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="anual" className="space-y-2">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV("anual")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">Año</th>
                        <th className="p-3 text-right font-medium">Capital</th>
                        <th className="p-3 text-right font-medium">Interés</th>
                        <th className="p-3 text-right font-medium">Total</th>
                        <th className="p-3 text-right font-medium">
                          Saldo Pendiente
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tablaAnual.map((fila) => (
                        <tr
                          key={fila.anio}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="p-3 font-medium">Año {fila.anio}</td>
                          <td className="p-3 text-right">
                            ${fila.capital.toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            ${fila.interes.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-medium">
                            ${fila.total.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            ${fila.saldo.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted font-semibold">
                      <tr>
                        <td className="p-3">TOTAL</td>
                        <td className="p-3 text-right">
                          $
                          {tablaAnual
                            .reduce((sum, f) => sum + f.capital, 0)
                            .toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          $
                          {tablaAnual
                            .reduce((sum, f) => sum + f.interes, 0)
                            .toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          $
                          {tablaAnual
                            .reduce((sum, f) => sum + f.total, 0)
                            .toLocaleString()}
                        </td>
                        <td className="p-3 text-right">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </TabsContent>
            </Tabs>

            {/* Fórmulas Excel */}
            {metadata?.formulasExcel && (
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-sm">
                <p className="font-semibold mb-2">📐 Fórmulas Excel:</p>
                <div className="space-y-1 font-mono text-xs">
                  <p>
                    <strong>TEA:</strong> {metadata.formulasExcel.tea}
                  </p>
                  <p>
                    <strong>Cuota:</strong>{" "}
                    {metadata.formulasExcel.cuotaMensual}
                  </p>
                  <p>
                    <strong>Interés:</strong>{" "}
                    {metadata.formulasExcel.interesMensual}
                  </p>
                  <p>
                    <strong>Capital:</strong>{" "}
                    {metadata.formulasExcel.capitalMensual}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
