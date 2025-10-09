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
import { machines as mockMachines } from "./models/data";
import { ViewMode, Machine } from "./models/types";
import { machinesService } from "./services/machinesService";

export default function Machines() {
  // Estados principales
  const [machines, setMachines] = useState<Machine[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Estados de modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // Cargar máquinas al montar el componente
  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    console.log("🔄 Frontend: Iniciando carga de máquinas...");
    setLoading(true);
    setError("");

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
      } else {
        console.warn("⚠️ Frontend: Error en la respuesta, usando datos mock");
        console.warn("Error details:", response.error);
        setError(response.error || "Error al cargar las máquinas");
        // Fallback a datos mock
        setMachines(mockMachines);
      }
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Frontend: Error inesperado:", err);
      setError(err.message || "Error inesperado al cargar las máquinas");
      setMachines(mockMachines); // Fallback a datos mock
      setLoading(false);
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

  // Si está cargando, mostrar el skeleton completo
  if (loading) {
    return <MachinesPageSkeleton />;
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
          <Button variant="outline" onClick={loadMachines} disabled={loading}>
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
