import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MachineStats,
  MachineToolbar,
  MachineTable,
  MachineGrid,
  CreateMachineModal,
  EditMachineModal,
  DeleteMachineModal,
  MachinesPageSkeleton,
  MachineStatsSkeleton,
  MachineTableSkeleton,
  MachineGridSkeleton,
} from "./components";
import { ViewMode, Machine } from "./models/types";
import { machinesService } from "./services/machinesService";

export default function Machines() {
  // Estados principales
  const [machines, setMachines] = useState<Machine[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  // Estados de modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // Cargar máquinas al montar el componente
  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async (isRetry = false) => {
    console.log("🔄 Frontend: Iniciando carga de máquinas...");

    if (!isRetry) {
      setLoading(true);
      setError("");
      setRetryCount(0);
    }

    try {
      console.log("📞 Frontend: Llamando a machinesService.getAllMachines()");
      const response = await machinesService.getAllMachines();

      console.log("📨 Frontend: Respuesta recibida:", response);

      if (response.success && response.data) {
        console.log(
          "✅ Frontend: Datos cargados exitosamente:",
          response.data.length,
          "máquinas"
        );
        setMachines(response.data);
        setLoading(false);
        setError("");
        setRetryCount(0);
      } else {
        // Si el backend está despertando, reintentar hasta 6 veces (60 segundos total)
        // Render puede tardar hasta 50 segundos en despertar el backend
        if (retryCount < 6) {
          console.log(
            `🔄 Reintentando... (${retryCount + 1}/6) - Esperando que el servidor despierte...`
          );
          setRetryCount((prev) => prev + 1);
          setTimeout(() => loadMachines(true), 10000); // Reintentar después de 10 segundos
        } else {
          console.error("❌ Máximo de reintentos alcanzado (60 segundos)");
          setError(
            "No se pudo conectar con el servidor después de 60 segundos. El servidor puede estar caído. Por favor, intenta nuevamente."
          );
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error("❌ Frontend: Error inesperado:", err);

      // Si el backend está despertando, reintentar hasta 6 veces (60 segundos total)
      if (retryCount < 6) {
        console.log(
          `🔄 Reintentando... (${retryCount + 1}/6) - Esperando que el servidor despierte...`
        );
        setRetryCount((prev) => prev + 1);
        setTimeout(() => loadMachines(true), 10000); // Reintentar después de 10 segundos
      } else {
        console.error("❌ Máximo de reintentos alcanzado (60 segundos)");
        setError(
          "No se pudo conectar con el servidor después de 60 segundos. El servidor puede estar caído. Por favor, intenta nuevamente."
        );
        setLoading(false);
      }
    }
  };

  // Filtrar máquinas basado en el término de búsqueda
  const filteredMachines = machines.filter((machine) => {
    const searchLower = searchTerm.toLowerCase();
    const machineCode =
      machine.otros_json?.codigo?.toLowerCase() ||
      `maq-${machine.id.toString().padStart(3, "0")}`;
    const equipoName = machine.modelo?.equipo?.nombre?.toLowerCase() || "";
    const marcaName = machine.modelo?.marca?.nombre?.toLowerCase() || "";
    const modeloName = machine.modelo?.nombre?.toLowerCase() || "";
    const estado = machine.estado?.toLowerCase() || "";

    return (
      machineCode.includes(searchLower) ||
      equipoName.includes(searchLower) ||
      marcaName.includes(searchLower) ||
      modeloName.includes(searchLower) ||
      estado.includes(searchLower)
    );
  });

  // Handlers para los modales
  const handleCreateMachine = () => {
    setCreateModalOpen(true);
  };

  const handleEditMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setEditModalOpen(true);
  };

  const handleDeleteMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setDeleteModalOpen(true);
  };

  const handleViewMachine = (machine: Machine) => {
    // TODO: Implementar modal de vista detallada
    console.log("Ver detalles de máquina:", machine);
  };

  // Handlers para cuando se completan las operaciones CRUD
  const handleMachineCreated = (newMachine: Machine) => {
    setMachines((prev) => [newMachine, ...prev]);
  };

  const handleMachineUpdated = (updatedMachine: Machine) => {
    setMachines((prev) =>
      prev.map((machine) =>
        machine.id === updatedMachine.id ? updatedMachine : machine
      )
    );
  };

  const handleMachineDeleted = (deletedMachineId: number) => {
    setMachines((prev) =>
      prev.filter((machine) => machine.id !== deletedMachineId)
    );
  };

  // Handler para cerrar modales
  const handleCloseModals = () => {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedMachine(null);
  };

  // Si está cargando, mostrar el skeleton completo con mensaje
  if (loading) {
    return (
      <div className="space-y-6">
        {retryCount > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Despertando el servidor... (Intento {retryCount}/6) - Esto puede
                tomar hasta 50 segundos
              </span>
            </AlertDescription>
          </Alert>
        )}
        <MachinesPageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestión de Máquinas
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra tu flota de maquinaria pesada
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => loadMachines(false)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
          <Button
            className="bg-primary hover:bg-primary-hover"
            onClick={handleCreateMachine}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Máquina
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <MachineStats machines={machines} />

      {/* Toolbar */}
      <MachineToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Machines Table/Grid */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Máquinas
            {filteredMachines.length !== machines.length && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredMachines.length} de {machines.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMachines.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No se encontraron máquinas que coincidan con tu búsqueda."
                  : "No hay máquinas registradas."}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={handleCreateMachine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar primera máquina
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <MachineTable
              machines={filteredMachines}
              onEdit={handleEditMachine}
              onDelete={handleDeleteMachine}
              onView={handleViewMachine}
            />
          ) : (
            <MachineGrid
              machines={filteredMachines}
              onEdit={handleEditMachine}
              onDelete={handleDeleteMachine}
              onView={handleViewMachine}
            />
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <CreateMachineModal
        isOpen={createModalOpen}
        onClose={handleCloseModals}
        onSuccess={handleMachineCreated}
      />

      <EditMachineModal
        isOpen={editModalOpen}
        machine={selectedMachine}
        onClose={handleCloseModals}
        onSuccess={handleMachineUpdated}
      />

      <DeleteMachineModal
        isOpen={deleteModalOpen}
        machine={selectedMachine}
        onClose={handleCloseModals}
        onSuccess={handleMachineDeleted}
      />
    </div>
  );
}
