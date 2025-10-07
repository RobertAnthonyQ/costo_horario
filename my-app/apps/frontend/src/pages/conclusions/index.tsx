import { useEffect, useMemo, useState } from "react";
import { machinesService } from "../machines/services/machinesService";
import { flujoCajaService } from "../calculations/cash-flow/services/flujoCajaService";
import { conclusionService } from "./services/conclusionService";
import type { Machine } from "../machines/models/types";
import type { FlujoCajaVersion } from "../calculations/cash-flow/models/types";
import type {
  CreateAnalisisConclusionDto,
  ConclusionResponse,
} from "./services/conclusionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { History, Plus, Save, Play, X } from "lucide-react";

export default function ConclusionsPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [versionsMap, setVersionsMap] = useState<
    Record<number, FlujoCajaVersion[]>
  >({});
  const [selected, setSelected] = useState<
    Array<{ machineId: number; versionId?: number }>
  >([]);
  const [lugarTrabajo, setLugarTrabajo] = useState("");
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConclusionResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pendingMachineId, setPendingMachineId] = useState<string>("");
  const [savingResult, setSavingResult] = useState(false);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const res = await conclusionService.getTodos();
    if (res.success && res.data) setHistory(res.data);
    setHistoryLoading(false);
  };

  useEffect(() => {
    machinesService.getAllMachines().then((res) => {
      if (res.success && res.data) setMachines(res.data);
    });
    // Cargar historial guardado
    loadHistory();
  }, []);

  const onPickMachine = async (machineId: number) => {
    if (selected.find((s) => s.machineId === machineId)) return;
    setSelected((prev) => [...prev, { machineId }]);
    const res = await flujoCajaService.getVersiones(machineId);
    if (res.success && res.data) {
      setVersionsMap((m) => ({ ...m, [machineId]: res.data }));
      const latest = res.data[0];
      setSelected((prev) =>
        prev.map((s) =>
          s.machineId === machineId ? { ...s, versionId: latest?.id } : s
        )
      );
    }
  };

  const addMachine = async () => {
    if (!pendingMachineId) return;
    const idNum = Number(pendingMachineId);
    if (selected.some((s) => s.machineId === idNum)) {
      toast.message("La máquina ya está agregada");
      return;
    }
    await onPickMachine(idNum);
    setPendingMachineId("");
  };

  const canAnalyze = useMemo(
    () =>
      selected.length > 0 &&
      selected.every((s) => !!s.versionId) &&
      !!lugarTrabajo,
    [selected, lugarTrabajo]
  );

  const analyze = async () => {
    if (!canAnalyze) {
      return toast.error(
        "Completa 'Lugar de trabajo' y la versión de cada máquina"
      );
    }
    setLoading(true);
    const payload: CreateAnalisisConclusionDto = {
      maquinas: selected.map((s) => ({
        machineId: s.machineId,
        versionId: s.versionId!,
      })),
      lugarTrabajo,
      comentario,
    };
    const res = await conclusionService.analizar(payload);
    setLoading(false);
    if (!res.success) return toast.error(res.error || "Error al analizar");
    setResult(res.data!);
    toast.success("Análisis generado");
  };

  const analyzeAndSave = async () => {
    if (!canAnalyze) {
      return toast.error(
        "Completa 'Lugar de trabajo' y la versión de cada máquina"
      );
    }
    setLoading(true);
    const payload: CreateAnalisisConclusionDto = {
      maquinas: selected.map((s) => ({
        machineId: s.machineId,
        versionId: s.versionId!,
      })),
      lugarTrabajo,
      comentario,
    };
    const res = await conclusionService.calcularYGuardar(payload);
    setLoading(false);
    if (!res.success)
      return toast.error(res.error || "Error al analizar y guardar");
    // Si el backend devuelve el análisis calculado, muéstralo; si no, solo refrescar historial
    if ((res as any).data?.maquinas) {
      setResult((res as any).data);
    }
    toast.success("Análisis analizado y guardado");
    loadHistory();
  };

  const saveResult = async () => {
    if (!result) return;
    setSavingResult(true);
    const res = await conclusionService.guardar(result);
    setSavingResult(false);
    if (!res.success) {
      return toast.error(res.error || "Error al guardar el resultado");
    }
    toast.success("Resultado guardado correctamente");
    loadHistory();
    // Actualizar el estado del resultado para marcar como guardado
    setResult((prev) =>
      prev ? { ...prev, estado: "guardado", analisisId: res.data?.id } : null
    );
  };

  const viewHistory = async (id: number) => {
    setHistoryLoading(true);
    const res = await conclusionService.getById(id);
    setHistoryLoading(false);
    if (!res.success || !res.data) {
      return toast.error(res.error || "No se pudo cargar el análisis");
    }
    setResult(res.data);
    // Opcional: reflejar parámetros en los campos visibles
    setLugarTrabajo(res.data.parametros?.lugarTrabajo || "");
    setComentario(res.data.parametros?.comentario || "");
    toast.success(`Análisis #${id} cargado desde el historial`);
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conclusiones - Comparar Máquinas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Selector de máquinas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Seleccionar máquina</Label>
              <div className="flex gap-2">
                <Select
                  value={pendingMachineId}
                  onValueChange={setPendingMachineId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Elige una máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.modelo?.marca?.nombre} {m.modelo?.nombre} #{m.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="default"
                  onClick={addMachine}
                  disabled={!pendingMachineId}
                >
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Puedes agregar múltiples máquinas. El comentario es único para
                todo el análisis.
              </p>
            </div>
          </div>

          {/* Separador visual para diferenciar los datos de análisis */}
          <Separator className="my-2" />

          {/* Datos del análisis: lugar de trabajo separado */}
          <div className="rounded-md border bg-muted/10 p-3">
            <div className="text-sm font-medium mb-2">Datos del análisis</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>
                  Lugar de trabajo <span className="text-red-600">*</span>
                </Label>
                <Input
                  value={lugarTrabajo}
                  onChange={(e) => setLugarTrabajo(e.target.value)}
                  placeholder="Ej: Mina Antapaccay"
                  required
                />
              </div>
              <div>
                <Label>Comentario (único)</Label>
                <Input
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="border rounded-md p-3">
              <div className="font-medium mb-2">Máquinas seleccionadas</div>
              <div className="space-y-2">
                {selected.map((s) => {
                  const versions = versionsMap[s.machineId] || [];
                  const machine = machines.find((m) => m.id === s.machineId);
                  return (
                    <div
                      key={s.machineId}
                      className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center"
                    >
                      <div className="text-sm">
                        {machine?.modelo?.marca?.nombre}{" "}
                        {machine?.modelo?.nombre} #{machine?.id}
                      </div>
                      <div>
                        <Select
                          value={s.versionId ? String(s.versionId) : undefined}
                          onValueChange={(v) =>
                            setSelected((prev) =>
                              prev.map((x) =>
                                x.machineId === s.machineId
                                  ? { ...x, versionId: Number(v) }
                                  : x
                              )
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Versión de flujo de caja" />
                          </SelectTrigger>
                          <SelectContent>
                            {versions.map((v) => (
                              <SelectItem key={v.id} value={String(v.id)}>
                                #{v.id} •{" "}
                                {new Date(v.fechaCalculo).toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelected((prev) =>
                              prev.filter((x) => x.machineId !== s.machineId)
                            )
                          }
                        >
                          <X className="h-4 w-4 mr-1" /> Quitar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button onClick={analyze} disabled={!canAnalyze || loading}>
              <Play className="h-4 w-4 mr-1" />
              {loading ? "Analizando..." : "Analizar"}
            </Button>
            <Button
              variant="secondary"
              onClick={analyzeAndSave}
              disabled={!canAnalyze || loading}
            >
              <Save className="h-4 w-4 mr-1" /> Analizar y Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Resultados</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setResult(null)} variant="ghost" size="sm">
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
              {result.estado !== "guardado" && (
                <Button
                  onClick={saveResult}
                  disabled={savingResult}
                  variant="outline"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {savingResult ? "Guardando..." : "Guardar Resultado"}
                </Button>
              )}
              {result.estado === "guardado" && result.analisisId && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Save className="h-4 w-4" />
                  Guardado (ID: {result.analisisId})
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Resumen ejecutivo y advertencias */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resumen ejecutivo</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {result.recomendaciones?.resumenEjecutivo || "—"}
                </CardContent>
              </Card>
              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Recomendación (IA)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                  {result.otrosDatos?.recomendacionTexto || "—"}
                  {result.otrosDatos?.iaFuente && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Fuente IA: {result.otrosDatos.iaFuente}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Conclusión (IA)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                  {result.otrosDatos?.conclusionTexto || "—"}
                </CardContent>
              </Card>
              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Mejores</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div>
                    VAN: {result.recomendaciones?.mejorVAN?.marca}{" "}
                    {result.recomendaciones?.mejorVAN?.modelo}
                  </div>
                  <div>
                    TIR: {result.recomendaciones?.mejorTIR?.marca}{" "}
                    {result.recomendaciones?.mejorTIR?.modelo}
                  </div>
                  <div>
                    B/C: {result.recomendaciones?.mejorBeneficioCosto?.marca}{" "}
                    {result.recomendaciones?.mejorBeneficioCosto?.modelo}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resumen (VAN/TIR)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div>
                    VAN promedio: {result.resumen.vanPromedio.toLocaleString()}
                  </div>
                  <div>
                    TIR promedio: {result.resumen.tirPromedio.toFixed(2)}%
                  </div>
                  <div>Total máquinas: {result.resumen.totalMaquinas}</div>
                </CardContent>
              </Card>
            </div>
            {/* Tabla comparativa minimalista por categorías */}
            <div className="overflow-x-auto">
              {(() => {
                const money = (v?: number) =>
                  typeof v === "number"
                    ? v.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—";
                const num = (v?: number, d = 2) =>
                  typeof v === "number"
                    ? v.toLocaleString(undefined, {
                        minimumFractionDigits: d,
                        maximumFractionDigits: d,
                      })
                    : "—";
                const txt = (v?: any) =>
                  v === undefined || v === null || v === "" ? "—" : String(v);

                const sections: {
                  title: string;
                  rows: Array<{
                    indicator: string;
                    abbr: string;
                    format?: "money" | "num" | "txt" | "pct";
                    digits?: number;
                    value: (m: (typeof result.maquinas)[number]) => any;
                    colorNegative?: boolean;
                  }>;
                }[] = [
                  {
                    title: "Técnicos",
                    rows: [
                      {
                        indicator: "Lugar de trabajo del equipo",
                        abbr: "-",
                        format: "txt",
                        value: () => result.parametros?.lugarTrabajo,
                      },
                      {
                        indicator: "Marca",
                        abbr: "-",
                        format: "txt",
                        value: (m) => m.marca,
                      },
                      {
                        indicator: "Modelo",
                        abbr: "-",
                        format: "txt",
                        value: (m) => m.modelo,
                      },
                      {
                        indicator: "Procedencia (país)",
                        abbr: "-",
                        format: "txt",
                        value: (m) => m.datosAdicionales?.procedencia_pais,
                      },
                      {
                        indicator: "Vida útil proyectada, según fabricante (h)",
                        abbr: "VU",
                        format: "num",
                        digits: 0,
                        value: (m) => m.vidaUtil,
                      },
                      {
                        indicator: "Potencia nominal (HP)",
                        abbr: "-",
                        format: "txt",
                        value: (m) => m.datosAdicionales?.potencia_nominal_hp,
                      },
                      {
                        indicator: "Consumo de combustible (L/h)",
                        abbr: "-",
                        format: "num",
                        digits: 1,
                        value: (m) =>
                          m.datosAdicionales?.consumo_combustible_lh,
                      },
                    ],
                  },
                  {
                    title: "Logística",
                    rows: [
                      {
                        indicator:
                          "Número de equipos comercializados por la marca en Perú",
                        abbr: "-",
                        format: "num",
                        digits: 0,
                        value: (m) =>
                          m.datosAdicionales?.equipos_comercializados_peru,
                      },
                      {
                        indicator:
                          "Soporte postventa, tiempo promedio de atención de repuestos (días)",
                        abbr: "-",
                        format: "txt",
                        value: (m) =>
                          m.datosAdicionales?.tiempo_atencion_repuestos_dias,
                      },
                      {
                        indicator: "Plazo de entrega (días)",
                        abbr: "-",
                        format: "num",
                        digits: 0,
                        value: (m) => m.datosAdicionales?.plazo_entrega_dias,
                      },
                      {
                        indicator: "Capacitación a operadores y técnicos (h)",
                        abbr: "-",
                        format: "num",
                        digits: 0,
                        value: (m) => m.datosAdicionales?.capacitacion_horas,
                      },
                    ],
                  },
                  {
                    title: "Financieros",
                    rows: [
                      {
                        indicator: "Valor de Adquisición ($)",
                        abbr: "VA",
                        format: "money",
                        value: (m) => m.valorAdquisicion,
                      },
                      {
                        indicator: "Valor Residual ($)",
                        abbr: "-",
                        format: "money",
                        value: (m) => m.valorResidual,
                      },
                      {
                        indicator: "Tarifa horaria interna (S/h)",
                        abbr: "Th",
                        format: "num",
                        digits: 2,
                        value: (m) => m.tarifaHorariaInterna,
                      },
                      {
                        indicator: "Tarifa horaria interna Equivalente (S/h)",
                        abbr: "Th_eq",
                        format: "num",
                        digits: 2,
                        value: (m) => m.tarifaHorariaInternaEquivalente,
                      },
                      {
                        indicator: "Valor Presente Neto ($)",
                        abbr: "VAN",
                        format: "money",
                        value: (m) => m.valorPresenteNeto,
                        colorNegative: true,
                      },
                      {
                        indicator: "Anualidad Equivalente del VAN (S/año)",
                        abbr: "AEV",
                        format: "money",
                        value: (m) => m.anualidadEquivalenteVAN,
                        colorNegative: true,
                      },
                      {
                        indicator: "Valor Presente Neto por Vida Útil ($/h)",
                        abbr: "VAN/h",
                        format: "money",
                        value: (m) => m.valorPresenteNetoPorVidaUtil,
                        colorNegative: true,
                      },
                      {
                        indicator: "Valor Presente Neto por Dólar Invertido",
                        abbr: "VAN/$",
                        format: "num",
                        digits: 3,
                        value: (m) => m.valorPresenteNetoPorDolarInvertido,
                        colorNegative: true,
                      },
                      {
                        indicator: "Tasa Interna de Retorno (%)",
                        abbr: "TIR",
                        format: "pct",
                        digits: 2,
                        value: (m) => m.tasaInternaRetorno,
                        colorNegative: true,
                      },
                      {
                        indicator: "Beneficio/Costo",
                        abbr: "B/C",
                        format: "num",
                        digits: 2,
                        value: (m) => m.beneficioCosto,
                        // No negativo por definición, pero dejamos sin color
                      },
                      {
                        indicator: "Retorno de la Inversión (%)",
                        abbr: "ROI",
                        format: "pct",
                        digits: 2,
                        value: (m) => m.retornoInversion,
                        colorNegative: true,
                      },
                      {
                        indicator: "Periodo de Recuperación (años)",
                        abbr: "Payback",
                        format: "num",
                        digits: 2,
                        value: (m) => m.periodoRecuperacion,
                      },
                      {
                        indicator: "Ofrece financiamiento y tasa efectiva",
                        abbr: "-",
                        format: "txt",
                        value: (m) =>
                          m.datosAdicionales?.ofrece_financiamiento
                            ? "Sí"
                            : "No",
                      },
                    ],
                  },
                ];

                const machineHeaders = result.maquinas.map(
                  (m) => `${m.marca} ${m.modelo}`
                );

                return (
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="border p-2 text-left">Categoría</th>
                        <th className="border p-2 text-left">Indicador</th>
                        <th className="border p-2 text-left">Abrev.</th>
                        {machineHeaders.map((h, i) => (
                          <th key={i} className="border p-2 text-right">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map((section, si) => {
                        const rowCount = section.rows.length;
                        return section.rows.map((row, ri) => (
                          <tr key={`${si}-${ri}`}>
                            {ri === 0 && (
                              <td
                                className="border p-2 align-top font-medium"
                                rowSpan={rowCount}
                              >
                                {section.title}
                              </td>
                            )}
                            <td className="border p-2">{row.indicator}</td>
                            <td className="border p-2">{row.abbr}</td>
                            {result.maquinas.map((m, mi) => {
                              const v = row.value(m as any);
                              let display: string;
                              switch (row.format) {
                                case "money":
                                  display = money(v);
                                  break;
                                case "pct":
                                  display =
                                    typeof v === "number"
                                      ? `${num(v, row.digits ?? 2)}%`
                                      : "—";
                                  break;
                                case "num":
                                  display = num(v, row.digits ?? 2);
                                  break;
                                case "txt":
                                default:
                                  display = txt(v);
                              }
                              const isNeg = typeof v === "number" && v < 0;
                              const cls =
                                row.colorNegative && isNeg
                                  ? "text-red-600"
                                  : "";
                              return (
                                <td
                                  key={mi}
                                  className={`border p-2 text-right ${cls}`}
                                >
                                  {display}
                                </td>
                              );
                            })}
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de conclusiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> Historial de análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No hay análisis guardados aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted/20">
                    <th className="border p-2 text-left">ID</th>
                    <th className="border p-2 text-left">Lugar</th>
                    <th className="border p-2 text-left">Fecha</th>
                    <th className="border p-2 text-left">Comentario</th>
                    <th className="border p-2 text-right">Máquinas</th>
                    <th className="border p-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any) => (
                    <tr key={h.id}>
                      <td className="border p-2">#{h.id}</td>
                      <td className="border p-2">{h.lugar_trabajo || "—"}</td>
                      <td className="border p-2">
                        {h.fecha_calculo
                          ? new Date(h.fecha_calculo).toLocaleString()
                          : "—"}
                      </td>
                      <td
                        className="border p-2 text-xs"
                        title={h.comentario || ""}
                      >
                        {h.comentario
                          ? h.comentario.length > 50
                            ? `${h.comentario.substring(0, 50)}...`
                            : h.comentario
                          : "—"}
                      </td>
                      <td className="border p-2 text-right">
                        {h.total_maquinas || 0}
                        {h.maquina && (
                          <div className="text-xs text-muted-foreground">
                            {h.maquina.marca} {h.maquina.modelo}
                          </div>
                        )}
                      </td>
                      <td className="border p-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewHistory(h.id)}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
