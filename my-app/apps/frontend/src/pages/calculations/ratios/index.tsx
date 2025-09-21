import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save, Table, Edit2, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IndividualRatioInput, RatioType, RatioVersion } from "./models/types";
import {
  ratiosService,
  CreateRatioDto,
  UpdateRatioDto,
} from "./services/ratiosService";
import { tiposRatioService } from "./services/tiposRatioService";
import { machinesService } from "../../machines/services/machinesService";
import { Machine } from "../possession/models/types";
export default function RatiosCalculation() {
  const [selectedMachine, setSelectedMachine] = useState("");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [ratioTypes, setRatioTypes] = useState<RatioType[]>([]);
  const [individualResults, setIndividualResults] =
    useState<RatioVersion | null>(null);
  const [historyByModelo, setHistoryByModelo] = useState<RatioVersion[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentModeloId, setCurrentModeloId] = useState<number | null>(null);
  const [latestByTipoMap, setLatestByTipoMap] = useState<
    Record<number, RatioVersion>
  >({});
  const [valuesByTipo, setValuesByTipo] = useState<Record<number, string>>({});
  const [editingRatios, setEditingRatios] = useState<Set<number>>(new Set());
  const [savingRatios, setSavingRatios] = useState<Set<number>>(new Set());

  // Estados para vista comparativa
  const [selectedMachinesForComparison, setSelectedMachinesForComparison] =
    useState<Machine[]>([]);
  const [comparisonData, setComparisonData] = useState<
    Record<string, Record<number, RatioVersion | null>>
  >({});
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);

  // Cargar máquinas
  useEffect(() => {
    machinesService.getAllMachines().then((res) => {
      if (res.success && res.data) setMachines(res.data);
    });
  }, []);

  // Cargar tipos de ratio reales
  useEffect(() => {
    tiposRatioService.listAll().then((res) => {
      if (res.success && res.data) setRatioTypes(res.data);
    });
  }, []);

  // Cuando cambia la máquina, resolver modelo_id y cargar historial por modelo
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedMachine) {
        setHistoryByModelo([]);
        return;
      }
      setLoadingHistory(true);
      try {
        const mResp = await machinesService.getMachineById(
          Number(selectedMachine)
        );
        const modeloId =
          mResp.success && mResp.data?.modelo?.id
            ? mResp.data.modelo.id
            : undefined;
        if (!modeloId) {
          setHistoryByModelo([]);
          setCurrentModeloId(null);
          setLatestByTipoMap({});
          return;
        }
        setCurrentModeloId(Number(modeloId));
        const hResp = await ratiosService.listByModelo(Number(modeloId));
        setHistoryByModelo(hResp.success && hResp.data ? hResp.data : []);
        const latestResp = await ratiosService.latestByModelo(Number(modeloId));
        if (latestResp.success && latestResp.data) {
          const map: Record<number, RatioVersion> = {};
          latestResp.data.forEach((r) => {
            map[r.tipo_ratio_id] = r;
          });
          setLatestByTipoMap(map);
        } else {
          setLatestByTipoMap({});
        }
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [selectedMachine]);

  // Sincronizar inputs del listado editable con los últimos valores
  useEffect(() => {
    const next: Record<number, string> = {};
    ratioTypes.forEach((t) => {
      const latest = latestByTipoMap[t.id];
      next[t.id] = latest && latest.valor != null ? String(latest.valor) : "";
    });
    setValuesByTipo(next);
  }, [ratioTypes, latestByTipoMap]);

  const handleRowValueChange = (tipoId: number, value: string) => {
    setValuesByTipo((prev) => ({ ...prev, [tipoId]: value }));
  };

  const handleRowSave = async (tipoId: number) => {
    if (!selectedMachine || !currentModeloId) return;

    setSavingRatios((prev) => new Set([...prev, tipoId]));

    try {
      const latest = latestByTipoMap[tipoId];
      const valorStr = valuesByTipo[tipoId];
      const valorNum = valorStr === "" ? null : Number(valorStr);

      if (latest) {
        const res = await ratiosService.update(latest.id, { valor: valorNum });
        if (!res.success) {
          alert(res.error || "Error al actualizar");
          return;
        }
      } else {
        const res = await ratiosService.create({
          modelo_id: currentModeloId,
          tipo_ratio_id: tipoId,
          valor: valorNum,
          fecha_efectiva: new Date().toISOString(),
        });
        if (!res.success) {
          alert(res.error || "Error al crear");
          return;
        }
      }

      // Refrescar historial y últimos
      const [hResp, latestResp] = await Promise.all([
        ratiosService.listByModelo(Number(currentModeloId)),
        ratiosService.latestByModelo(Number(currentModeloId)),
      ]);
      setHistoryByModelo(hResp.success && hResp.data ? hResp.data : []);
      if (latestResp.success && latestResp.data) {
        const map: Record<number, RatioVersion> = {};
        latestResp.data.forEach((r) => (map[r.tipo_ratio_id] = r));
        setLatestByTipoMap(map);
      }

      // Salir del modo edición
      setEditingRatios((prev) => {
        const next = new Set(prev);
        next.delete(tipoId);
        return next;
      });
    } finally {
      setSavingRatios((prev) => {
        const next = new Set(prev);
        next.delete(tipoId);
        return next;
      });
    }
  };

  const handleEditRatio = (tipoId: number) => {
    setEditingRatios((prev) => new Set([...prev, tipoId]));
  };

  // Funciones para vista comparativa
  const addMachineToComparison = async (machine: Machine) => {
    if (selectedMachinesForComparison.find((m) => m.id === machine.id)) {
      return; // Ya está agregada
    }

    setSelectedMachinesForComparison((prev) => [...prev, machine]);
    setLoadingComparison(true);

    try {
      if (machine.modelo?.id) {
        const ratiosResp = await ratiosService.latestByModelo(
          machine.modelo.id
        );
        const ratiosMap: Record<number, RatioVersion | null> = {};

        ratioTypes.forEach((tipo) => {
          const ratio =
            ratiosResp.success && ratiosResp.data
              ? ratiosResp.data.find((r) => r.tipo_ratio_id === tipo.id) || null
              : null;
          ratiosMap[tipo.id] = ratio;
        });

        setComparisonData((prev) => ({
          ...prev,
          [machine.id]: ratiosMap,
        }));
      }
    } finally {
      setLoadingComparison(false);
      setShowMachineModal(false);
    }
  };

  const removeMachineFromComparison = (machineId: number) => {
    setSelectedMachinesForComparison((prev) =>
      prev.filter((m) => m.id !== machineId)
    );
    setComparisonData((prev) => {
      const next = { ...prev };
      delete next[machineId];
      return next;
    });
  };

  const availableMachinesForComparison = machines.filter(
    (m) => !selectedMachinesForComparison.find((sm) => sm.id === m.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Cálculos de Ratio
        </h1>
        <p className="text-muted-foreground mt-1">
          Agrega y versiona ratios por máquina, y compara resultados.
        </p>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            Vista Individual
          </TabsTrigger>
          <TabsTrigger value="comparative" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Vista Comparativa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Selección de Máquina</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Máquina</Label>
                      <Select
                        value={selectedMachine}
                        onValueChange={setSelectedMachine}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar máquina" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {machines.map((m) => (
                            <SelectItem key={m.id} value={m.id.toString()}>
                              {m.id_equipo_interno || `Máquina ${m.id}`} —{" "}
                              {m.modelo?.marca?.nombre} {m.modelo?.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-semibold mb-2">Resultado</h3>
                {individualResults ? (
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Tipo Ratio ID:</span>{" "}
                      {individualResults.tipo_ratio_id}
                    </div>
                    <div>
                      <span className="font-medium">Valor:</span>{" "}
                      {individualResults.valor ?? "—"}
                    </div>
                    <div>
                      <span className="font-medium">Fecha:</span>{" "}
                      {new Date(
                        individualResults.fecha_efectiva
                      ).toLocaleDateString("es-ES")}
                    </div>
                    {individualResults.comentario && (
                      <div>
                        <span className="font-medium">Comentario:</span>{" "}
                        {individualResults.comentario}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Sin resultados aún
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Ratios del Modelo (editar/crear)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedMachine ? (
                    <div className="text-muted-foreground text-sm">
                      Selecciona una máquina para ver sus ratios
                    </div>
                  ) : loadingHistory ? (
                    <div className="text-sm">Cargando ratios...</div>
                  ) : (
                    (() => {
                      const groups: Record<string, RatioType[]> = {};
                      ratioTypes.forEach((t) => {
                        const cat = t.categoria || "Sin categoría";
                        if (!groups[cat]) groups[cat] = [];
                        groups[cat].push(t);
                      });
                      const collator = new Intl.Collator(undefined, {
                        numeric: true,
                        sensitivity: "base",
                      });
                      const sortedCats = Object.keys(groups).sort((a, b) =>
                        collator.compare(a, b)
                      );
                      return (
                        <div className="space-y-6">
                          {sortedCats.map((cat) => (
                            <div key={cat}>
                              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                {cat}
                              </div>
                              <div className="space-y-3">
                                {groups[cat]
                                  .sort((a, b) =>
                                    collator.compare(a.nombre, b.nombre)
                                  )
                                  .map((t) => {
                                    const latest = latestByTipoMap[t.id];
                                    const isEditing = editingRatios.has(t.id);
                                    const isSaving = savingRatios.has(t.id);
                                    const currentValue =
                                      latest && latest.valor != null
                                        ? String(latest.valor)
                                        : "";
                                    const displayValue = isEditing
                                      ? (valuesByTipo[t.id] ?? currentValue)
                                      : currentValue;

                                    return (
                                      <div
                                        key={t.id}
                                        className="flex items-center gap-3"
                                      >
                                        <div className="flex-1">
                                          <Label className="text-sm">
                                            {t.nombre}
                                          </Label>
                                        </div>
                                        {isEditing ? (
                                          <Input
                                            type="number"
                                            step="0.01"
                                            className="w-28"
                                            value={
                                              valuesByTipo[t.id] ?? currentValue
                                            }
                                            onChange={(e) =>
                                              handleRowValueChange(
                                                t.id,
                                                e.target.value
                                              )
                                            }
                                            disabled={isSaving}
                                          />
                                        ) : (
                                          <div className="w-28 px-3 py-2 text-sm bg-muted rounded-md">
                                            {displayValue || "—"}
                                          </div>
                                        )}
                                        {isEditing ? (
                                          <Button
                                            size="sm"
                                            onClick={() => handleRowSave(t.id)}
                                            disabled={
                                              isSaving ||
                                              !selectedMachine ||
                                              !currentModeloId
                                            }
                                          >
                                            {isSaving ? (
                                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                            ) : (
                                              <Save className="mr-2 h-4 w-4" />
                                            )}
                                            Guardar
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              handleEditRatio(t.id)
                                            }
                                            disabled={
                                              !selectedMachine ||
                                              !currentModeloId
                                            }
                                          >
                                            <Edit2 className="mr-2 h-4 w-4" />
                                            Editar
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparative" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Vista de Tabla - Análisis Comparativo
              </h2>
              <p className="text-muted-foreground">
                Compara valores de ratios entre diferentes máquinas
              </p>
            </div>

            {/* Tarjetas de máquinas seleccionadas */}
            <div className="flex flex-wrap gap-4 mb-6">
              {selectedMachinesForComparison.map((machine) => (
                <Card key={machine.id} className="min-w-[300px]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">
                          {machine.id_equipo_interno || `Máquina ${machine.id}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {machine.modelo?.marca?.nombre}{" "}
                          {machine.modelo?.nombre}
                        </p>
                        {machine.valor_similar_nuevo && (
                          <p className="text-xs text-muted-foreground">
                            {new Intl.NumberFormat("es-ES", {
                              style: "currency",
                              currency: "USD",
                            }).format(machine.valor_similar_nuevo)}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeMachineFromComparison(machine.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Tarjeta para agregar máquina */}
              <Dialog
                open={showMachineModal}
                onOpenChange={setShowMachineModal}
              >
                <DialogTrigger asChild>
                  <Card className="min-w-[300px] border-dashed border-2 hover:border-primary/50 cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-center h-full">
                      <div className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Agregar Máquina</p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Seleccionar Máquina para Comparación
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {availableMachinesForComparison.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No hay más máquinas disponibles para agregar
                      </p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableMachinesForComparison.map((machine) => (
                          <div
                            key={machine.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                            onClick={() => addMachineToComparison(machine)}
                          >
                            <div className="font-medium">
                              {machine.id_equipo_interno ||
                                `Máquina ${machine.id}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {machine.modelo?.marca?.nombre}{" "}
                              {machine.modelo?.nombre}
                            </div>
                            {machine.valor_similar_nuevo && (
                              <div className="text-xs text-muted-foreground">
                                {new Intl.NumberFormat("es-ES", {
                                  style: "currency",
                                  currency: "USD",
                                }).format(machine.valor_similar_nuevo)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Tabla comparativa */}
            {selectedMachinesForComparison.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados Comparativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="text-left p-4 font-medium border-b w-1/4">
                            Métrica
                          </th>
                          {selectedMachinesForComparison.map((machine) => (
                            <th
                              key={machine.id}
                              className="text-center p-4 font-medium border-b"
                              style={{
                                width: `${75 / selectedMachinesForComparison.length}%`,
                              }}
                            >
                              <div className="text-sm font-semibold">
                                {machine.id_equipo_interno ||
                                  `Máquina ${machine.id}`}
                              </div>
                              <div className="text-xs font-normal text-muted-foreground mt-1">
                                {machine.modelo?.nombre}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const groups: Record<string, RatioType[]> = {};
                          ratioTypes.forEach((t) => {
                            const cat = t.categoria || "Sin categoría";
                            if (!groups[cat]) groups[cat] = [];
                            groups[cat].push(t);
                          });

                          const rows: React.ReactNode[] = [];
                          const sortedCats = Object.keys(groups).sort();

                          sortedCats.forEach((category, catIndex) => {
                            // Fila de separador de categoría
                            if (catIndex > 0) {
                              rows.push(
                                <tr key={`separator-${category}`}>
                                  <td
                                    colSpan={
                                      selectedMachinesForComparison.length + 1
                                    }
                                    className="p-0"
                                  >
                                    <div className="h-2 bg-muted/20"></div>
                                  </td>
                                </tr>
                              );
                            }

                            // Fila de encabezado de categoría
                            rows.push(
                              <tr
                                key={`header-${category}`}
                                className="bg-muted/10"
                              >
                                <td
                                  colSpan={
                                    selectedMachinesForComparison.length + 1
                                  }
                                  className="p-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold border-b"
                                >
                                  {category}
                                </td>
                              </tr>
                            );

                            const typesInCategory = groups[category].sort(
                              (a, b) => a.nombre.localeCompare(b.nombre)
                            );

                            typesInCategory.forEach((tipo, index) => {
                              rows.push(
                                <tr
                                  key={tipo.id}
                                  className={`${
                                    index % 2 === 0
                                      ? "bg-background"
                                      : "bg-muted/5"
                                  } hover:bg-muted/20 border-b border-muted/20`}
                                >
                                  <td className="p-4 font-medium text-sm">
                                    {tipo.nombre}
                                  </td>
                                  {selectedMachinesForComparison.map(
                                    (machine) => {
                                      const ratioData =
                                        comparisonData[machine.id]?.[tipo.id];
                                      return (
                                        <td
                                          key={machine.id}
                                          className="p-4 text-center"
                                        >
                                          {loadingComparison ? (
                                            <div className="text-muted-foreground">
                                              —
                                            </div>
                                          ) : ratioData &&
                                            ratioData.valor !== null ? (
                                            <span className="font-semibold text-primary text-sm">
                                              {ratioData.valor}
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">
                                              —
                                            </span>
                                          )}
                                        </td>
                                      );
                                    }
                                  )}
                                </tr>
                              );
                            });
                          });

                          return rows;
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {loadingComparison && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Cargando datos de comparación...
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedMachinesForComparison.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">
                    No hay máquinas seleccionadas
                  </h3>
                  <p className="text-sm">
                    Agrega máquinas usando el botón "Agregar Máquina" para
                    comenzar la comparación
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
