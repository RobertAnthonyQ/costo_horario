import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Plus,
  Calendar,
  Calculator,
  X,
  Truck,
  History,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  TableViewData,
  CalculationMachine,
  PossessionVersion,
  MachineWithVersion,
  Machine,
} from "../models/types";
import { machinesService } from "../../../machines/services/machinesService";
import { possessionService } from "../services/possessionService";

interface PossessionTableProps {
  data: TableViewData;
  availableVersions: PossessionVersion[];
  onMachineAdd: (machine: CalculationMachine) => string; // Devuelve el instanceId generado
  onVersionSelect: (instanceId: string, version: PossessionVersion) => void;
  onRemoveMachine: (instanceId: string) => void;
}

export default function PossessionTable({
  data,
  availableVersions,
  onMachineAdd,
  onVersionSelect,
  onRemoveMachine,
}: PossessionTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [selectedMachineForModal, setSelectedMachineForModal] =
    useState<Machine | null>(null);
  const [selectedVersionForModal, setSelectedVersionForModal] =
    useState<string>("");

  // Estados para carga de máquinas
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [machinesError, setMachinesError] = useState<string | null>(null);

  // Estados para carga de versiones en el modal
  const [modalVersions, setModalVersions] = useState<PossessionVersion[]>([]);
  const [loadingModalVersions, setLoadingModalVersions] = useState(false);
  const [modalVersionsError, setModalVersionsError] = useState<string | null>(
    null
  );

  // Versiones por máquina para el selector de las tarjetas
  const [versionsByMachine, setVersionsByMachine] = useState<
    Record<number, PossessionVersion[]>
  >({});
  const [loadingVersionsByMachine, setLoadingVersionsByMachine] = useState<
    Record<number, boolean>
  >({});
  const [errorVersionsByMachine, setErrorVersionsByMachine] = useState<
    Record<number, string | null>
  >({});

  // Cargar máquinas cuando se abre el modal
  useEffect(() => {
    if (showMachineModal && machines.length === 0) {
      loadMachines();
    }
  }, [showMachineModal]);

  const loadMachines = async () => {
    console.log("🚀 Cargando máquinas...");
    setLoadingMachines(true);
    setMachinesError(null);

    try {
      const response = await machinesService.getAllMachines();

      if (response.success && response.data) {
        console.log("✅ Máquinas cargadas exitosamente:", response.data.length);
        setMachines(response.data);
      } else {
        console.error("❌ Error en la respuesta:", response.error);
        setMachinesError(response.error || "Error al cargar las máquinas");
      }
    } catch (error) {
      console.error("❌ Error al cargar máquinas:", error);
      setMachinesError("Error de conexión al cargar las máquinas");
    } finally {
      setLoadingMachines(false);
    }
  };

  const loadModalVersions = async (machineId: number) => {
    console.log("🚀 Cargando versiones para máquina:", machineId);
    setLoadingModalVersions(true);
    setModalVersionsError(null);

    try {
      const response =
        await possessionService.getPossessionSummaryByMachine(machineId);

      if (response.success && response.data) {
        console.log(
          "✅ Versiones cargadas exitosamente:",
          response.data.length
        );
        setModalVersions(response.data);
      } else {
        console.error("❌ Error en la respuesta de versiones:", response.error);
        // No mostrar error si simplemente no hay versiones
        if (
          response.error?.includes("404") ||
          response.error?.includes("not found")
        ) {
          setModalVersions([]);
        } else {
          setModalVersionsError(
            response.error || "Error al cargar las versiones"
          );
        }
      }
    } catch (error) {
      console.error("❌ Error al cargar versiones:", error);
      setModalVersionsError("Error de conexión al cargar las versiones");
    } finally {
      setLoadingModalVersions(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVersionsForMachine = (machineId: number) => {
    // Prioriza las versiones locales cargadas por máquina
    if (versionsByMachine[machineId]) return versionsByMachine[machineId];
    // Fallback a las versiones provistas por prop (si existen)
    return availableVersions.filter((v) => v.machine_id === machineId);
  };

  // Cargar versiones resumen para cada máquina agregada en la vista comparativa
  useEffect(() => {
    const fetchMissingVersions = async () => {
      for (const md of data.machines) {
        const machineId = md.machine.id;
        if (
          !versionsByMachine[machineId] &&
          !loadingVersionsByMachine[machineId]
        ) {
          setLoadingVersionsByMachine((prev) => ({
            ...prev,
            [machineId]: true,
          }));
          setErrorVersionsByMachine((prev) => ({ ...prev, [machineId]: null }));
          try {
            const resp =
              await possessionService.getPossessionSummaryByMachine(machineId);
            if (resp.success && resp.data) {
              setVersionsByMachine((prev) => ({
                ...prev,
                [machineId]: resp.data,
              }));
            } else {
              setErrorVersionsByMachine((prev) => ({
                ...prev,
                [machineId]: resp.error || "Error al cargar versiones",
              }));
            }
          } catch (e) {
            setErrorVersionsByMachine((prev) => ({
              ...prev,
              [machineId]: "Error de conexión al cargar versiones",
            }));
          } finally {
            setLoadingVersionsByMachine((prev) => ({
              ...prev,
              [machineId]: false,
            }));
          }
        }
      }
    };
    if (data.machines.length > 0) fetchMissingVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.machines]);

  const filteredMachines = machines.filter((machine) => {
    const searchLower = searchTerm.toLowerCase();
    const machineName = machine.id_equipo_interno || `Máquina ${machine.id}`;
    return (
      machineName.toLowerCase().includes(searchLower) ||
      machine.modelo.marca.nombre.toLowerCase().includes(searchLower) ||
      machine.modelo.nombre.toLowerCase().includes(searchLower)
    );
  });

  const handleOpenMachineModal = () => {
    setShowMachineModal(true);
    setSelectedMachineForModal(null);
    setSelectedVersionForModal("");
    setSearchTerm("");
    setModalVersions([]);
    setModalVersionsError(null);
  };

  const handleSelectMachineInModal = (machine: Machine) => {
    setSelectedMachineForModal(machine);
    setSelectedVersionForModal("");
    // Cargar versiones para la máquina seleccionada
    loadModalVersions(machine.id);
  };

  const convertMachineToCalculationMachine = (
    machine: Machine
  ): CalculationMachine => {
    return {
      id: machine.id,
      name: machine.id_equipo_interno || `Máquina ${machine.id}`,
      value: machine.valor_similar_nuevo || 0,
      lifeYears: Math.floor((machine.vida_util || 0) / 8760), // Convertir horas a años aproximadamente
      brand: machine.modelo.marca.nombre,
      model: machine.modelo.nombre,
    };
  };

  const handleConfirmAddMachine = () => {
    if (selectedMachineForModal) {
      const calculationMachine = convertMachineToCalculationMachine(
        selectedMachineForModal
      );
      const instanceId = onMachineAdd(calculationMachine);

      // Si se seleccionó una versión, también aplicarla
      if (selectedVersionForModal && selectedVersionForModal !== "new") {
        const version = modalVersions.find(
          (v) => v.id.toString() === selectedVersionForModal
        );
        if (version) {
          setTimeout(() => {
            onVersionSelect(instanceId, version);
          }, 100);
        }
      }

      setShowMachineModal(false);
      setSelectedMachineForModal(null);
      setSelectedVersionForModal("");
      setModalVersions([]);
      setModalVersionsError(null);
    }
  };

  // Escenarios dinámicos: derivar horas desde los resultados seleccionados
  const scenarioHours = useMemo(() => {
    // Crear unión de todos los escenarios de todas las máquinas con resultados
    const set = new Set<number>();
    data.machines.forEach((m) =>
      m.results?.forEach((r) => set.add(r.horasMinimas))
    );

    // Si no hay resultados, devolver array vacío
    if (set.size === 0) {
      return [];
    }

    // Ordenar ascendente para consistencia visual
    return Array.from(set).sort((a, b) => a - b);
  }, [data.machines]);

  // Índice por horas para acceso O(1) por instancia de máquina
  const resultsByHours = useMemo(() => {
    const map = new Map<string, Map<number, any>>();
    data.machines.forEach((md) => {
      const inner = new Map<number, any>();
      md.results?.forEach((r: any) => inner.set(r.horasMinimas, r));
      map.set(md.instanceId, inner);
    });
    return map;
  }, [data.machines]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Vista de Tabla - Análisis Comparativo
          </h2>
          <p className="text-muted-foreground">
            Compara resultados de posesión entre diferentes máquinas y
            escenarios
          </p>
        </div>
      </div>

      {/* Machine Selection and Version Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.machines.map((machineData) => {
          const versions = getVersionsForMachine(machineData.machine.id);
          return (
            <Card key={machineData.instanceId} className="h-fit">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {machineData.machine.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(machineData.machine.value)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onRemoveMachine(machineData.instanceId)}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Versión de Posesión</Label>
                    <Select
                      value={machineData.selectedVersion?.id.toString() || ""}
                      onValueChange={(value) => {
                        const version = versions.find(
                          (v) => v.id.toString() === value
                        );
                        if (version) {
                          onVersionSelect(machineData.instanceId, version);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar versión" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((version) => (
                          <SelectItem
                            key={version.id}
                            value={version.id.toString()}
                          >
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs">
                                {formatDate(version.fecha_calculo)}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {version.numero_escenarios} esc.
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {machineData.selectedVersion && (
                    <div className="text-xs">
                      <p className="font-medium text-muted-foreground">
                        Comentario:
                      </p>
                      <p className="text-muted-foreground truncate">
                        {machineData.selectedVersion.comentario ||
                          "Sin comentarios"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Machine Card */}
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors h-fit">
          <CardContent className="flex flex-col items-center justify-center p-4 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-3 flex flex-col items-center space-y-1"
              onClick={handleOpenMachineModal}
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Agregar Máquina
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Machine Selection Modal */}
      <Dialog open={showMachineModal} onOpenChange={setShowMachineModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Agregar Nueva Máquina
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Error al cargar máquinas */}
            {machinesError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{machinesError}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Search Machine */}
            <div>
              <Label htmlFor="modal-search">Filtrar máquinas (opcional)</Label>
              <Input
                id="modal-search"
                placeholder="Filtrar por nombre, marca o modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
                disabled={loadingMachines}
              />
              {loadingMachines && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Cargando máquinas...
                  </span>
                </div>
              )}
            </div>

            {/* Machine Results - Always show when modal is open */}
            <div className="space-y-2">
              <Label>Máquinas disponibles:</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredMachines.map((machine) => (
                  <div
                    key={machine.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMachineForModal?.id === machine.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/30"
                    }`}
                    onClick={() => handleSelectMachineInModal(machine)}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {machine.id_equipo_interno || `Máquina ${machine.id}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {machine.modelo.marca.nombre} -{" "}
                          {machine.modelo.nombre}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        $
                        {machine.valor_similar_nuevo?.toLocaleString() || "N/A"}
                      </p>
                      {selectedMachineForModal?.id === machine.id && (
                        <Badge variant="default" className="mt-1">
                          Seleccionada
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                {filteredMachines.length === 0 && !loadingMachines && (
                  <p className="text-center text-muted-foreground py-4">
                    No se encontraron máquinas con ese término de búsqueda
                  </p>
                )}

                {machines.length === 0 && !loadingMachines && (
                  <p className="text-center text-muted-foreground py-4">
                    No hay máquinas disponibles
                  </p>
                )}
              </div>
            </div>

            {/* Step 2: Version Selection (if machine selected) */}
            {selectedMachineForModal && (
              <>
                <Separator />
                <div>
                  <Label>Versión de Posesión (Opcional)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Selecciona una versión existente o déjala en blanco para
                    configurar después
                  </p>

                  {/* Error al cargar versiones */}
                  {modalVersionsError && (
                    <Alert variant="destructive" className="mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{modalVersionsError}</AlertDescription>
                    </Alert>
                  )}

                  <Select
                    value={selectedVersionForModal}
                    onValueChange={setSelectedVersionForModal}
                    disabled={loadingModalVersions}
                  >
                    <SelectTrigger>
                      {loadingModalVersions ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cargando versiones...
                        </div>
                      ) : (
                        <SelectValue placeholder="Seleccionar versión (opcional)" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span className="text-primary font-medium">
                            Nuevo Cálculo
                          </span>
                        </div>
                      </SelectItem>
                      {modalVersions.map((version) => (
                        <SelectItem
                          key={version.id}
                          value={version.id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {new Date(
                                  version.fecha_calculo
                                ).toLocaleDateString("es-ES")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {version.numero_escenarios} escenarios
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {modalVersions.length === 0 &&
                    !loadingModalVersions &&
                    !modalVersionsError && (
                      <p className="text-sm text-muted-foreground mt-2">
                        No hay versiones de posesión disponibles para esta
                        máquina
                      </p>
                    )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMachineModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAddMachine}
              disabled={!selectedMachineForModal}
            >
              Agregar Máquina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-4 w-4" />
            Resultados Comparativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-56 sticky left-0 bg-background font-medium border-r">
                    Métrica
                  </TableHead>
                  <TableHead className="w-28 text-center border-r">
                    Escenario
                  </TableHead>
                  {data.machines.map((machineData) => (
                    <TableHead
                      key={machineData.instanceId}
                      className="text-center min-w-40"
                    >
                      <div>
                        <p className="font-medium">
                          {machineData.machine.name ||
                            machineData.machine.brand}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {machineData.machine.model}
                        </p>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Años de Vida Ideal */}
                {scenarioHours.map((hours, idx) => (
                  <TableRow key={`vida-ideal-${hours}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={scenarioHours.length}
                        className="font-medium sticky left-0 bg-background border-r text-center align-middle"
                      >
                        Años de Vida Ideal
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r">
                      <span className="text-xs text-muted-foreground">
                        {hours}h
                      </span>
                    </TableCell>
                    {data.machines.map((machineData) => {
                      const res = resultsByHours
                        .get(machineData.instanceId)
                        ?.get(hours);
                      return (
                        <TableCell
                          key={machineData.instanceId}
                          className="text-center"
                        >
                          {res ? (
                            <p className="font-medium text-purple-600">
                              {res.aniosVidaIdeal.toFixed(1)} años
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Separador visual */}
                <TableRow>
                  <TableCell
                    colSpan={data.machines.length + 2}
                    className="h-2 bg-muted/30"
                  />
                </TableRow>

                {/* Factor de Mercado */}
                {scenarioHours.map((hours, idx) => (
                  <TableRow key={`factor-mercado-${hours}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={scenarioHours.length}
                        className="font-medium sticky left-0 bg-background border-r text-center align-middle"
                      >
                        Factor de Mercado
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r">
                      <span className="text-xs text-muted-foreground">
                        {hours}h
                      </span>
                    </TableCell>
                    {data.machines.map((machineData) => {
                      const res = resultsByHours
                        .get(machineData.instanceId)
                        ?.get(hours);
                      return (
                        <TableCell
                          key={machineData.instanceId}
                          className="text-center"
                        >
                          {res ? (
                            <p className="font-medium text-orange-600">
                              {(res.factorDeMercado * 100).toFixed(2)}%
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Separador visual */}
                <TableRow>
                  <TableCell
                    colSpan={data.machines.length + 2}
                    className="h-2 bg-muted/30"
                  />
                </TableRow>

                {/* Depreciación Real */}
                {scenarioHours.map((hours, idx) => (
                  <TableRow key={`depreciacion-real-${hours}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={scenarioHours.length}
                        className="font-medium sticky left-0 bg-background border-r text-center align-middle"
                      >
                        Depreciación Real
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r">
                      <span className="text-xs text-muted-foreground">
                        {hours}h
                      </span>
                    </TableCell>
                    {data.machines.map((machineData) => {
                      const res = resultsByHours
                        .get(machineData.instanceId)
                        ?.get(hours);
                      return (
                        <TableCell
                          key={machineData.instanceId}
                          className="text-center"
                        >
                          {res ? (
                            <p className="font-medium text-red-600">
                              {formatCurrency(res.depreciacionReal)}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Separador visual */}
                <TableRow>
                  <TableCell
                    colSpan={data.machines.length + 2}
                    className="h-2 bg-muted/30"
                  />
                </TableRow>

                {/* Valor Comercial Real */}
                {scenarioHours.map((hours, idx) => (
                  <TableRow key={`valor-comercial-${hours}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={scenarioHours.length}
                        className="font-medium sticky left-0 bg-background border-r text-center align-middle"
                      >
                        Valor Comercial Real
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r">
                      <span className="text-xs text-muted-foreground">
                        {hours}h
                      </span>
                    </TableCell>
                    {data.machines.map((machineData) => {
                      const res = resultsByHours
                        .get(machineData.instanceId)
                        ?.get(hours);
                      return (
                        <TableCell
                          key={machineData.instanceId}
                          className="text-center"
                        >
                          {res ? (
                            <div>
                              <p className="font-medium text-green-600">
                                {formatCurrency(res.valorComercialReal)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {res.porcentajeValorComercialReal.toFixed(1)}%
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Separador visual */}
                <TableRow>
                  <TableCell
                    colSpan={data.machines.length + 2}
                    className="h-2 bg-muted/30"
                  />
                </TableRow>

                {/* Vida Útil Fabricante */}
                {scenarioHours.map((hours, idx) => (
                  <TableRow key={`vida-util-${hours}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={scenarioHours.length}
                        className="font-medium sticky left-0 bg-background border-r text-center align-middle"
                      >
                        Vida Útil Fabricante
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r">
                      <span className="text-xs text-muted-foreground">
                        {hours}h
                      </span>
                    </TableCell>
                    {data.machines.map((machineData) => {
                      const res = resultsByHours
                        .get(machineData.instanceId)
                        ?.get(hours);
                      return (
                        <TableCell
                          key={machineData.instanceId}
                          className="text-center"
                        >
                          {res ? (
                            <p className="font-medium text-indigo-600">
                              {res.vidaUtilFabricante.toLocaleString()}h
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Separador visual */}
                <TableRow>
                  <TableCell
                    colSpan={data.machines.length + 2}
                    className="h-2 bg-muted/30"
                  />
                </TableRow>

                {/* Depreciación Teórica */}
                {scenarioHours.map((hours, idx) => (
                  <TableRow key={`depreciacion-teorica-${hours}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={scenarioHours.length}
                        className="font-medium sticky left-0 bg-background border-r text-center align-middle"
                      >
                        Depreciación Teórica
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r">
                      <span className="text-xs text-muted-foreground">
                        {hours}h
                      </span>
                    </TableCell>
                    {data.machines.map((machineData) => {
                      const res = resultsByHours
                        .get(machineData.instanceId)
                        ?.get(hours);
                      return (
                        <TableCell
                          key={machineData.instanceId}
                          className="text-center"
                        >
                          {res ? (
                            <p className="font-medium text-pink-600">
                              {formatCurrency(res.depreciacionTeorica)}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Separador visual */}
                <TableRow>
                  <TableCell
                    colSpan={data.machines.length + 2}
                    className="h-2 bg-muted/30"
                  />
                </TableRow>

                {/* Grado de Operatividad */}
                {scenarioHours.map((hours, idx) => (
                  <TableRow key={`grado-operatividad-${hours}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={scenarioHours.length}
                        className="font-medium sticky left-0 bg-background border-r text-center align-middle"
                      >
                        Grado de Operatividad
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r">
                      <span className="text-xs text-muted-foreground">
                        {hours}h
                      </span>
                    </TableCell>
                    {data.machines.map((machineData) => {
                      const res = resultsByHours
                        .get(machineData.instanceId)
                        ?.get(hours);
                      return (
                        <TableCell
                          key={machineData.instanceId}
                          className="text-center"
                        >
                          {res ? (
                            <p className="font-medium text-teal-600">
                              {(res.gradoDeOperatividad * 100).toFixed(2)}%
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Separador visual */}
                <TableRow>
                  <TableCell
                    colSpan={data.machines.length + 2}
                    className="h-2 bg-muted/30"
                  />
                </TableRow>

                {/* Depreciación Real Anual */}
                {scenarioHours.map((hours, idx) => (
                  <TableRow key={`depreciacion-anual-${hours}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={scenarioHours.length}
                        className="font-medium sticky left-0 bg-background border-r text-center align-middle"
                      >
                        Depreciación Real Anual
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r">
                      <span className="text-xs text-muted-foreground">
                        {hours}h
                      </span>
                    </TableCell>
                    {data.machines.map((machineData) => {
                      const res = resultsByHours
                        .get(machineData.instanceId)
                        ?.get(hours);
                      return (
                        <TableCell
                          key={machineData.instanceId}
                          className="text-center"
                        >
                          {res ? (
                            <p className="font-medium text-amber-600">
                              {formatCurrency(res.depreciacionRealAnual)}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Separador visual */}
                <TableRow>
                  <TableCell
                    colSpan={data.machines.length + 2}
                    className="h-2 bg-muted/30"
                  />
                </TableRow>

                {/* Valor Comercial Teórico */}
                {scenarioHours.map((hours, idx) => (
                  <TableRow key={`valor-teorico-${hours}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={scenarioHours.length}
                        className="font-medium sticky left-0 bg-background border-r text-center align-middle"
                      >
                        Valor Comercial Teórico
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r">
                      <span className="text-xs text-muted-foreground">
                        {hours}h
                      </span>
                    </TableCell>
                    {data.machines.map((machineData) => {
                      const res = resultsByHours
                        .get(machineData.instanceId)
                        ?.get(hours);
                      return (
                        <TableCell
                          key={machineData.instanceId}
                          className="text-center"
                        >
                          {res ? (
                            <p className="font-medium text-cyan-600">
                              {formatCurrency(res.valorComercialTeorico)}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}

                {/* Separador visual */}
                <TableRow>
                  <TableCell
                    colSpan={data.machines.length + 2}
                    className="h-2 bg-muted/30"
                  />
                </TableRow>

                {/* Depreciación Real Horaria */}
                {scenarioHours.map((hours, idx) => (
                  <TableRow key={`depreciacion-horaria-${hours}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={scenarioHours.length}
                        className="font-medium sticky left-0 bg-background border-r text-center align-middle"
                      >
                        Depreciación Real Horaria
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r">
                      <span className="text-xs text-muted-foreground">
                        {hours}h
                      </span>
                    </TableCell>
                    {data.machines.map((machineData) => {
                      const res = resultsByHours
                        .get(machineData.instanceId)
                        ?.get(hours);
                      return (
                        <TableCell
                          key={machineData.instanceId}
                          className="text-center"
                        >
                          {res ? (
                            <p className="font-medium text-emerald-600">
                              {formatCurrency(res.depreciacionRealHoraria)}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data.machines.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="mx-auto h-12 w-12 mb-4" />
              <p>No hay máquinas agregadas para comparar</p>
              <p className="text-sm">Agrega máquinas para ver la comparación</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
