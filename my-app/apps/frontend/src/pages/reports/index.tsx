import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, BarChart3, TrendingUp } from "lucide-react";
import {
  ReportsTable,
  ReportsStatsCards,
  ReportsFiltersBar,
} from "./components";
import { reportsService } from "./services/reportsService";
import {
  MachineReportData,
  ReportsFilters,
  ReportsStats,
} from "./models/types";

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MachineReportData[]>([]);
  const [stats, setStats] = useState<ReportsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ReportsFilters>({
    searchTerm: "",
    equipoFilter: "",
    marcaFilter: "",
    estadoFilter: "",
    sortField: "id",
    sortDirection: "asc",
  });

  // Cargar datos iniciales
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [reportsResponse, statsResponse] = await Promise.all([
        reportsService.getAllMachinesReports(),
        reportsService.getReportsStats(),
      ]);

      if (reportsResponse.success && reportsResponse.data) {
        setData(reportsResponse.data);
      } else {
        throw new Error(reportsResponse.error || "Error al cargar reportes");
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      toast.error("Error al cargar los reportes", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Función de filtrado y ordenamiento
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    // Aplicar filtros
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.machine.marca?.toLowerCase().includes(searchLower) ||
          item.machine.modelo?.toLowerCase().includes(searchLower) ||
          item.machine.equipo?.toLowerCase().includes(searchLower) ||
          item.machine.idEquipo?.toLowerCase().includes(searchLower) ||
          item.machine.id.toString().includes(searchLower)
      );
    }

    if (filters.equipoFilter) {
      filtered = filtered.filter(
        (item) => item.machine.equipo === filters.equipoFilter
      );
    }

    if (filters.marcaFilter) {
      filtered = filtered.filter(
        (item) => item.machine.marca === filters.marcaFilter
      );
    }

    if (filters.estadoFilter) {
      filtered = filtered.filter(
        (item) => item.machine.estado === filters.estadoFilter
      );
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortField) {
        case "fechaCalculo":
          aValue = a.latestReport?.fechaCalculo || "";
          bValue = b.latestReport?.fechaCalculo || "";
          break;
        case "costoHorario":
          aValue = a.resumen?.[0]?.Costo_Hr || 0;
          bValue = b.resumen?.[0]?.Costo_Hr || 0;
          break;
        case "valorSimilarNuevo":
          aValue = parseInt(a.machine.valorSimilarNuevo) || 0;
          bValue = parseInt(b.machine.valorSimilarNuevo) || 0;
          break;
        default:
          aValue = a.machine[filters.sortField as keyof typeof a.machine] || "";
          bValue = b.machine[filters.sortField as keyof typeof b.machine] || "";
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return filters.sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return filters.sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [data, filters]);

  const handleViewDetails = (machineId: number, reportId: number) => {
    navigate(`/hourly-cost?machineId=${machineId}&reportId=${reportId}`);
  };

  const handleExport = () => {
    // Implementar exportación
    toast.info("Función de exportación", {
      description: "Será implementada próximamente",
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Error al cargar los reportes
            </h2>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              {error}
            </p>
            <Button onClick={loadData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Reportes y Análisis
          </h1>
          <p className="text-muted-foreground mt-1">
            Análisis de costos horarios por máquina y escenarios operacionales
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Cargando..." : "Actualizar"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <ReportsStatsCards stats={stats} isLoading={isLoading} />

      {/* Filters */}
      <ReportsFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={loadData}
        onExport={handleExport}
        data={data}
        isLoading={isLoading}
      />

      {/* Results Summary */}
      {!isLoading && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>
              Mostrando {filteredAndSortedData.length} de {data.length} máquinas
            </span>
          </div>
          {filteredAndSortedData.length !== data.length && (
            <span className="text-orange-600 font-medium">
              (filtrado aplicado)
            </span>
          )}
        </div>
      )}

      {/* Reports Table */}
      <ReportsTable
        data={filteredAndSortedData}
        onViewDetails={handleViewDetails}
      />

      {/* Footer Info */}
      {!isLoading && data.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center justify-between">
                <span>
                  Los costos mostrados corresponden al primer escenario (mayor
                  cantidad de horas mínimas) de cada máquina.
                </span>
                <span>
                  Haga clic en las filas para ver todos los escenarios de costo.
                </span>
              </div>
              <div className="text-xs">
                <strong>Leyenda:</strong> D = Depreciación, F = Financiamiento,
                S = Seguro, Mp = Mantenimiento Preventivo, Mc = Mantenimiento
                Correctivo, R&M = Reparación y Mantenimiento, MO Téc = Mano de
                Obra Técnica
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
