import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save, Table, Edit2, Plus, X, MapPin, Archive } from "lucide-react";
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
  // Edición y guardado global
  const [isEditing, setIsEditing] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);

  // Estados para guardado de historial
  const [savingHistory, setSavingHistory] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [historialLocation, setHistorialLocation] = useState("");

  // Estados para vista comparativa (permitir múltiples versiones de la MISMA máquina)
  interface ComparisonEntry {
    comparisonId: string; // único por instancia añadida
    machine: Machine;
  }
  const [comparisonEntries, setComparisonEntries] = useState<ComparisonEntry[]>(
    []
  );
  const [comparisonData, setComparisonData] = useState<
    Record<string, Record<number, RatioVersion | null>>
  >({}); // clave: comparisonId
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);

  // Estados para selección de versiones
  const [machineVersions, setMachineVersions] = useState<Record<string, any[]>>(
    {}
  );
  const [selectedVersions, setSelectedVersions] = useState<
    Record<string, string>
  >({}); // clave: comparisonId -> versionId ("latest" o id numérico string)
  const [showVersionModal, setShowVersionModal] = useState<{
    entry: ComparisonEntry | null;
    show: boolean;
  }>({ entry: null, show: false });
  // Nuevo flujo: agregar máquina eligiendo versión dentro del mismo modal
  const [machineBeingAdded, setMachineBeingAdded] = useState<Machine | null>(
    null
  );
  const [addingMachineLoading, setAddingMachineLoading] = useState(false);
  const [comparisonLocations, setComparisonLocations] = useState<
    Record<string, string | undefined>
  >({}); // clave comparisonId

  // Cargar máquinas
  useEffect(() => {
    machinesService.getAllMachines().then((res) => {
      if (res.success && res.data) setMachines(res.data);
    });
  }, []);

  // Cargar tipos de ratio reales (excluyendo el ID 100 que es solo para historiales)
  useEffect(() => {
    tiposRatioService.listAll().then((res) => {
      if (res.success && res.data) {
        // Filtrar el tipo de ratio con ID 100 (es solo para historiales completos)
        const filteredRatios = res.data.filter((ratio) => ratio.id !== 100);
        setRatioTypes(filteredRatios);
      }
    });
  }, []);

  // Función para cargar historial (reutilizable)
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

        // Obtener el último lugar de operación registrado para prellenar el modal
        const latestWithLocation = latestResp.data.find(
          (r) => r.lugar_operacion
        );
        if (latestWithLocation?.lugar_operacion) {
          setHistorialLocation(latestWithLocation.lugar_operacion);
        }
      } else {
        setLatestByTipoMap({});
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  // Cuando cambia la máquina, resolver modelo_id y cargar historial por modelo
  useEffect(() => {
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

  // Guardado masivo: crea/actualiza todos los ratios editados
  const handleBulkSave = async () => {
    if (!selectedMachine || !currentModeloId) {
      alert("Debe seleccionar una máquina válida");
      return;
    }

    setSavingBulk(true);

    try {
      // Iterar sobre todos los tipos y crear/actualizar solo si hay cambios
      for (const t of ratioTypes) {
        const latest = latestByTipoMap[t.id];
        const valorStr = valuesByTipo[t.id];
        const valorNum = valorStr === "" ? null : Number(valorStr);
        const currentVal = latest?.valor ?? null;

        // Si no hubo cambios, saltar
        if (currentVal === valorNum) continue;

        if (latest) {
          const res = await ratiosService.update(latest.id, {
            valor: valorNum,
          });
          if (!res.success) {
            alert(res.error || `Error al actualizar ratio ${t.nombre}`);
            return; // abortar en el primer error
          }
        } else {
          const res = await ratiosService.create({
            modelo_id: currentModeloId,
            tipo_ratio_id: t.id,
            valor: valorNum,
            fecha_efectiva: new Date().toISOString(),
          });
          if (!res.success) {
            alert(res.error || `Error al crear ratio ${t.nombre}`);
            return; // abortar en el primer error
          }
        }
      }

      // Refrescar historial y últimos una vez al final
      const [hResp, latestResp] = await Promise.all([
        ratiosService.listByModelo(Number(currentModeloId)),
        ratiosService.latestByModelo(Number(currentModeloId)),
      ]);
      setHistoryByModelo(hResp.success && hResp.data ? hResp.data : []);
      if (latestResp.success && latestResp.data) {
        const map: Record<number, RatioVersion> = {};
        latestResp.data.forEach((r) => (map[r.tipo_ratio_id] = r));
        setLatestByTipoMap(map);
      } else {
        setLatestByTipoMap({});
      }

      setIsEditing(false);
      alert("Cambios guardados correctamente");
    } finally {
      setSavingBulk(false);
    }
  };

  // Función para abrir el modal de ubicación antes de guardar historial
  const handleSaveHistory = () => {
    if (!currentModeloId) {
      alert("Debe seleccionar una máquina válida");
      return;
    }
    setShowLocationModal(true);
  };

  // Función que realmente guarda el historial con la ubicación
  const confirmSaveHistory = async () => {
    if (!currentModeloId) {
      alert("Debe seleccionar una máquina válida");
      return;
    }

    setSavingHistory(true);
    setShowLocationModal(false);

    try {
      const comentario = `Historial guardado desde vista individual - ${new Date().toLocaleString("es-ES")}`;

      const response = await ratiosService.createCompleteVersion(
        currentModeloId,
        {
          comentario,
          usuario_id: "frontend-user", // Puedes cambiarlo por el usuario actual si lo tienes
          lugar_operacion: historialLocation || undefined,
        }
      );

      if (response.success) {
        const locationMsg = historialLocation
          ? ` en ubicación: ${historialLocation}`
          : "";
        alert(
          `✅ Historial guardado exitosamente como versión JSON completa${locationMsg}`
        );
        // Refrescar los datos
        await loadHistory();
      } else {
        alert(`❌ ${response.error || "Error al guardar el historial"}`);
      }
    } catch (error) {
      alert("Error de conexión al guardar el historial");
    } finally {
      setSavingHistory(false);
    }
  };

  // Funciones para vista comparativa
  const addMachineToComparison = async (machine: Machine) => {
    await addMachineWithVersion(machine, "latest");
  };

  // Nueva función unificada para agregar máquina con versión específica
  const addMachineWithVersion = async (machine: Machine, versionId: string) => {
    const comparisonId = `${machine.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    setAddingMachineLoading(true);
    try {
      setComparisonEntries((prev) => [...prev, { comparisonId, machine }]);
      setSelectedVersions((prev) => ({ ...prev, [comparisonId]: versionId }));
      if (versionId === "latest") {
        if (machine.modelo?.id) {
          const ratiosResp = await ratiosService.latestByModelo(
            machine.modelo.id
          );
          const ratiosMap: Record<number, RatioVersion | null> = {};
          ratioTypes.forEach((tipo) => {
            const ratio =
              ratiosResp.success && ratiosResp.data
                ? ratiosResp.data.find((r) => r.tipo_ratio_id === tipo.id) ||
                  null
                : null;
            ratiosMap[tipo.id] = ratio;
          });
          setComparisonData((prev) => ({
            ...prev,
            [comparisonId]: ratiosMap,
          }));
          if (ratiosResp.success && ratiosResp.data) {
            const withLoc = ratiosResp.data.find((r) => r.lugar_operacion);
            if (withLoc) {
              setComparisonLocations((prev) => ({
                ...prev,
                [comparisonId]: withLoc.lugar_operacion,
              }));
            }
          }
        }
      } else {
        let versions = machineVersions[machine.id];
        if (!versions) {
          await loadMachineVersions(machine);
          versions = machineVersions[machine.id];
        }
        const selectedVersion = versions?.find(
          (v: any) => v.id.toString() === versionId
        );
        if (selectedVersion?.ratios_version?.ratios) {
          const ratiosMap: Record<number, RatioVersion | null> = {};
          ratioTypes.forEach((tipo) => {
            const ratioInVersion = selectedVersion.ratios_version.ratios.find(
              (r: any) => r.tipo_ratio_id === tipo.id
            );
            if (ratioInVersion) {
              ratiosMap[tipo.id] = {
                id: selectedVersion.id,
                modelo_id: selectedVersion.modelo?.id,
                tipo_ratio_id: tipo.id,
                valor: ratioInVersion.valor,
                fecha_efectiva: selectedVersion.fecha_efectiva,
                comentario: selectedVersion.ratios_version.comentario,
                lugar_operacion: selectedVersion.lugar_operacion,
                ratios_version: selectedVersion.ratios_version,
              } as RatioVersion;
            } else {
              ratiosMap[tipo.id] = null;
            }
          });
          setComparisonData((prev) => ({ ...prev, [comparisonId]: ratiosMap }));
          setComparisonLocations((prev) => ({
            ...prev,
            [comparisonId]: selectedVersion.lugar_operacion,
          }));
        }
      }
    } finally {
      setAddingMachineLoading(false);
      setMachineBeingAdded(null);
      setShowMachineModal(false);
    }
  };

  const removeComparisonEntry = (comparisonId: string) => {
    setComparisonEntries((prev) =>
      prev.filter((e) => e.comparisonId !== comparisonId)
    );
    setComparisonData((prev) => {
      const next = { ...prev };
      delete next[comparisonId];
      return next;
    });
    setSelectedVersions((prev) => {
      const next = { ...prev };
      delete next[comparisonId];
      return next;
    });
    setComparisonLocations((prev) => {
      const next = { ...prev };
      delete next[comparisonId];
      return next;
    });
  };

  // Ahora se permiten duplicados => todas las máquinas disponibles
  const availableMachinesForComparison = machines;

  // Funciones para manejar versiones
  const loadMachineVersions = async (machine: Machine) => {
    if (!machine.modelo?.id) return;

    try {
      const versionsResp = await ratiosService.getVersionesByModelo(
        machine.modelo.id
      );
      if (versionsResp.success && versionsResp.data) {
        setMachineVersions((prev) => ({
          ...prev,
          [machine.id]: versionsResp.data,
        }));
      }
    } catch (error) {
      console.error("Error loading versions:", error);
    }
  };

  const selectVersionForEntry = async (
    entry: ComparisonEntry,
    versionId: string
  ) => {
    const { comparisonId, machine } = entry;
    setSelectedVersions((prev) => ({ ...prev, [comparisonId]: versionId }));

    // Si se selecciona "latest", usar los últimos ratios
    if (versionId === "latest") {
      if (machine?.modelo?.id) {
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

        setComparisonData((prev) => ({ ...prev, [comparisonId]: ratiosMap }));
        if (ratiosResp.success && ratiosResp.data) {
          const withLoc = ratiosResp.data.find((r) => r.lugar_operacion);
          setComparisonLocations((prev) => ({
            ...prev,
            [comparisonId]: withLoc?.lugar_operacion,
          }));
        }
      }
    } else {
      // Si se selecciona una versión específica, usar los datos de esa versión JSON
      const versions = machineVersions[machine.id];
      const selectedVersion = versions?.find(
        (v) => v.id.toString() === versionId
      );

      if (selectedVersion?.ratios_version?.ratios) {
        const ratiosMap: Record<number, RatioVersion | null> = {};

        ratioTypes.forEach((tipo) => {
          const ratioInVersion = selectedVersion.ratios_version.ratios.find(
            (r: any) => r.tipo_ratio_id === tipo.id
          );

          if (ratioInVersion) {
            ratiosMap[tipo.id] = {
              id: selectedVersion.id,
              modelo_id: selectedVersion.modelo?.id,
              tipo_ratio_id: tipo.id,
              valor: ratioInVersion.valor,
              fecha_efectiva: selectedVersion.fecha_efectiva,
              comentario: selectedVersion.ratios_version.comentario,
              lugar_operacion: selectedVersion.lugar_operacion,
              ratios_version: selectedVersion.ratios_version,
            } as RatioVersion;
          } else {
            ratiosMap[tipo.id] = null;
          }
        });

        setComparisonData((prev) => ({ ...prev, [comparisonId]: ratiosMap }));
        setComparisonLocations((prev) => ({
          ...prev,
          [comparisonId]: selectedVersion.lugar_operacion,
        }));
      }
    }
    setShowVersionModal({ entry: null, show: false });
  };

  const openVersionSelector = (entry: ComparisonEntry) => {
    setShowVersionModal({ entry, show: true });
    loadMachineVersions(entry.machine);
  };

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
                      ).toLocaleString("es-ES", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZone: "America/Lima",
                      })}
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
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>Ratios del Modelo</CardTitle>
                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          disabled={!selectedMachine || !currentModeloId}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(false)}
                            disabled={savingBulk}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleBulkSave}
                            disabled={savingBulk || !currentModeloId}
                          >
                            {savingBulk ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Guardar Cambios
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
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
                                            disabled={savingBulk}
                                          />
                                        ) : (
                                          <div className="w-28 px-3 py-2 text-sm bg-muted rounded-md">
                                            {displayValue || "—"}
                                          </div>
                                        )}
                                        {/* Sin botones individuales; se usa Guardar Cambios global */}
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

                  {/* Botón de Guardar Historial */}
                  {selectedMachine && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={handleSaveHistory}
                        disabled={savingHistory || !currentModeloId}
                        className="w-full"
                        size="lg"
                      >
                        {savingHistory ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        ) : (
                          <Archive className="h-4 w-4 mr-2" />
                        )}
                        Guardar Historial Completo
                      </Button>
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        Guarda una versión JSON con todos los ratios actuales.
                        Se solicitará la ubicación antes de guardar.
                      </div>
                    </div>
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
              {comparisonEntries.map((entry) => {
                const machine = entry.machine;
                return (
                  <Card key={entry.comparisonId} className="min-w-[300px]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">
                            {machine.id_equipo_interno ||
                              `Máquina ${machine.id}`}
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
                          onClick={() =>
                            removeComparisonEntry(entry.comparisonId)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Selector de versión */}
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          Versión:{" "}
                          {selectedVersions[entry.comparisonId] === "latest" ||
                          !selectedVersions[entry.comparisonId]
                            ? "Últimos valores"
                            : `Versión ID ${selectedVersions[entry.comparisonId]}`}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openVersionSelector(entry)}
                          className="w-full"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Seleccionar Versión
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

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
                      {machineBeingAdded
                        ? `Elegir Versión - ${
                            machineBeingAdded.id_equipo_interno ||
                            `Máquina ${machineBeingAdded.id}`
                          }`
                        : "Seleccionar Máquina para Comparación"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!machineBeingAdded ? (
                      availableMachinesForComparison.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          No hay más máquinas disponibles para agregar
                        </p>
                      ) : (
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {availableMachinesForComparison.map((machine) => (
                            <div
                              key={machine.id}
                              className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                              onClick={async () => {
                                setMachineBeingAdded(machine);
                                await loadMachineVersions(machine);
                              }}
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
                      )
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMachineBeingAdded(null)}
                          >
                            ← Volver
                          </Button>
                          <div className="text-xs text-muted-foreground">
                            Selecciona una versión para agregar la máquina
                          </div>
                        </div>
                        <div
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                          onClick={() =>
                            addMachineWithVersion(machineBeingAdded, "latest")
                          }
                        >
                          <div className="font-medium">Últimos valores</div>
                          <div className="text-xs text-muted-foreground">
                            Usar ratios más recientes
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {machineVersions[machineBeingAdded.id]?.map(
                            (version: any) => (
                              <div
                                key={version.id}
                                className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                                onClick={() =>
                                  addMachineWithVersion(
                                    machineBeingAdded,
                                    version.id.toString()
                                  )
                                }
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      Versión ID: {version.id}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {(() => {
                                        const ts =
                                          version.ratios_version
                                            ?.fecha_efectiva ||
                                          version.fecha_efectiva;
                                        const d = new Date(ts);
                                        return isNaN(d.getTime())
                                          ? ts
                                          : d.toLocaleString("es-ES", {
                                              year: "numeric",
                                              month: "2-digit",
                                              day: "2-digit",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              second: "2-digit",
                                              timeZone: "America/Lima",
                                            });
                                      })()}
                                    </div>
                                    {version.lugar_operacion && (
                                      <div className="text-xs text-muted-foreground">
                                        📍 {version.lugar_operacion}
                                      </div>
                                    )}
                                    {version.ratios_version?.comentario && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        💬 {version.ratios_version.comentario}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs bg-muted px-2 py-1 rounded">
                                    {version.ratios_version?.ratios?.length ||
                                      0}{" "}
                                    ratios
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                          {addingMachineLoading && (
                            <div className="text-center text-xs text-muted-foreground py-2">
                              Agregando...
                            </div>
                          )}
                          {machineVersions[machineBeingAdded.id]?.length ===
                            0 && (
                            <div className="text-center py-4 text-muted-foreground text-xs">
                              No hay versiones JSON, usa "Últimos valores".
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Modal para seleccionar versión */}
              <Dialog
                open={showVersionModal.show}
                onOpenChange={(open) =>
                  setShowVersionModal({ entry: null, show: open })
                }
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Seleccionar Versión para{" "}
                      {showVersionModal.entry?.machine.id_equipo_interno ||
                        (showVersionModal.entry &&
                          `Máquina ${showVersionModal.entry.machine.id}`)}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Opción para usar últimos valores */}
                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() =>
                        showVersionModal.entry &&
                        selectVersionForEntry(showVersionModal.entry, "latest")
                      }
                    >
                      <div className="font-medium">
                        Últimos valores registrados
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Usar los ratios más recientes de cada tipo
                      </div>
                    </div>

                    {/* Lista de versiones JSON */}
                    {showVersionModal.entry &&
                    machineVersions[showVersionModal.entry.machine.id]?.length >
                      0 ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Versiones JSON guardadas:
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {showVersionModal.entry &&
                            machineVersions[
                              showVersionModal.entry.machine.id
                            ].map((version: any) => (
                              <div
                                key={version.id}
                                className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                                onClick={() =>
                                  showVersionModal.entry &&
                                  selectVersionForEntry(
                                    showVersionModal.entry,
                                    version.id.toString()
                                  )
                                }
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      Versión ID: {version.id}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {(() => {
                                        const ts =
                                          version.ratios_version
                                            ?.fecha_efectiva ||
                                          version.fecha_efectiva;
                                        const d = new Date(ts);
                                        return isNaN(d.getTime())
                                          ? ts
                                          : d.toLocaleString("es-ES", {
                                              year: "numeric",
                                              month: "2-digit",
                                              day: "2-digit",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              second: "2-digit",
                                              timeZone: "America/Lima",
                                            });
                                      })()}
                                    </div>
                                    {version.lugar_operacion && (
                                      <div className="text-xs text-muted-foreground">
                                        📍 {version.lugar_operacion}
                                      </div>
                                    )}
                                    {version.ratios_version?.comentario && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        💬 {version.ratios_version.comentario}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs bg-muted px-2 py-1 rounded">
                                    {version.ratios_version?.ratios?.length ||
                                      0}{" "}
                                    ratios
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <div className="text-sm">
                          No hay versiones JSON para esta máquina
                        </div>
                        <div className="text-xs">
                          Solo se pueden usar los últimos valores registrados
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Tabla comparativa */}
            {comparisonEntries.length > 0 && (
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
                          {comparisonEntries.map((entry) => (
                            <th
                              key={entry.comparisonId}
                              className="text-center p-4 font-medium border-b"
                              style={{
                                width: `${75 / comparisonEntries.length}%`,
                              }}
                            >
                              <div className="text-sm font-semibold">
                                {entry.machine.id_equipo_interno ||
                                  `Máquina ${entry.machine.id}`}
                              </div>
                              <div className="text-xs font-normal text-muted-foreground mt-1">
                                {entry.machine.modelo?.nombre}
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
                          // Fila de ubicación
                          rows.push(
                            <tr
                              key="fila-ubicacion"
                              className="bg-muted/5 border-b border-muted/20"
                            >
                              <td className="p-4 font-medium text-sm">
                                Ubicación
                              </td>
                              {comparisonEntries.map((entry) => (
                                <td
                                  key={entry.comparisonId}
                                  className="p-4 text-center text-xs text-muted-foreground"
                                >
                                  {comparisonLocations[entry.comparisonId] ||
                                    "—"}
                                </td>
                              ))}
                            </tr>
                          );
                          const sortedCats = Object.keys(groups).sort();

                          sortedCats.forEach((category, catIndex) => {
                            // Fila de separador de categoría
                            if (catIndex > 0) {
                              rows.push(
                                <tr key={`separator-${category}`}>
                                  <td
                                    colSpan={comparisonEntries.length + 1}
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
                                  colSpan={comparisonEntries.length + 1}
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
                                  {comparisonEntries.map((entry) => {
                                    const ratioData =
                                      comparisonData[entry.comparisonId]?.[
                                        tipo.id
                                      ];
                                    return (
                                      <td
                                        key={entry.comparisonId}
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
                                  })}
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

            {comparisonEntries.length === 0 && (
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

      {/* Modal para ingresar ubicación al guardar historial */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Guardar Historial Completo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Se creará una versión JSON con todos los ratios actuales de la
              máquina seleccionada.
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="historial-location"
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Ubicación / Location
              </Label>
              <Input
                id="historial-location"
                type="text"
                placeholder="Ej: Mina Norte - Sector A"
                value={historialLocation}
                onChange={(e) => setHistorialLocation(e.target.value)}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Opcional: Especifica dónde se registraron estos ratios
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowLocationModal(false)}
                disabled={savingHistory}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmSaveHistory}
                disabled={savingHistory || !currentModeloId}
              >
                {savingHistory ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : (
                  <Archive className="h-4 w-4 mr-2" />
                )}
                Guardar Historial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
