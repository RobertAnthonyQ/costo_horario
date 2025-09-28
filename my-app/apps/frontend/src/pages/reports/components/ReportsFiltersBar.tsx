import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X,
  RefreshCw,
  Download,
} from "lucide-react";
import { ReportsFilters, MachineReportData } from "../models/types";

interface ReportsFiltersProps {
  filters: ReportsFilters;
  onFiltersChange: (filters: ReportsFilters) => void;
  onRefresh: () => void;
  onExport?: () => void;
  data: MachineReportData[];
  isLoading: boolean;
}

export const ReportsFiltersBar: React.FC<ReportsFiltersProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  data,
  isLoading,
}) => {
  // Extraer opciones únicas de los datos
  const equipos = [...new Set(data.map((item) => item.machine.equipo))]
    .filter(Boolean)
    .sort();
  const marcas = [...new Set(data.map((item) => item.machine.marca))]
    .filter(Boolean)
    .sort();
  const estados = [...new Set(data.map((item) => item.machine.estado))]
    .filter(Boolean)
    .sort();

  const hasActiveFilters =
    filters.searchTerm ||
    filters.equipoFilter ||
    filters.marcaFilter ||
    filters.estadoFilter;

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: "",
      equipoFilter: "",
      marcaFilter: "",
      estadoFilter: "",
      sortField: "id",
      sortDirection: "asc",
    });
  };

  const handleEquipoChange = (value: string) => {
    onFiltersChange({ ...filters, equipoFilter: value === "all" ? "" : value });
  };

  const handleMarcaChange = (value: string) => {
    onFiltersChange({ ...filters, marcaFilter: value === "all" ? "" : value });
  };

  const handleEstadoChange = (value: string) => {
    onFiltersChange({ ...filters, estadoFilter: value === "all" ? "" : value });
  };

  const sortOptions = [
    { value: "id", label: "ID Máquina" },
    { value: "modelo", label: "Modelo" },
    { value: "marca", label: "Marca" },
    { value: "equipo", label: "Equipo" },
    { value: "valorSimilarNuevo", label: "Valor Adquisición" },
    { value: "fechaCalculo", label: "Fecha Reporte" },
    { value: "costoHorario", label: "Costo Horario" },
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por máquina, modelo, marca..."
              value={filters.searchTerm}
              onChange={(e) =>
                onFiltersChange({ ...filters, searchTerm: e.target.value })
              }
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Filtro por Equipo */}
        <Select
          value={filters.equipoFilter || "all"}
          onValueChange={handleEquipoChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo de Equipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Equipos</SelectItem>
            {equipos.map((equipo) => (
              <SelectItem key={equipo} value={equipo}>
                {equipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Marca */}
        <Select
          value={filters.marcaFilter || "all"}
          onValueChange={handleMarcaChange}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las Marcas</SelectItem>
            {marcas.map((marca) => (
              <SelectItem key={marca} value={marca}>
                {marca}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Estado */}
        <Select
          value={filters.estadoFilter || "all"}
          onValueChange={handleEstadoChange}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Estados</SelectItem>
            {estados.map((estado) => (
              <SelectItem key={estado} value={estado}>
                {estado.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ordenamiento */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {filters.sortDirection === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              Ordenar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    sortField: option.value as any,
                    sortDirection:
                      filters.sortField === option.value &&
                      filters.sortDirection === "asc"
                        ? "desc"
                        : "asc",
                  })
                }
                className="flex items-center justify-between"
              >
                <span>{option.label}</span>
                {filters.sortField === option.value &&
                  (filters.sortDirection === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  ))}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Badges de filtros activos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Búsqueda: "{filters.searchTerm}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, searchTerm: "" })}
              />
            </Badge>
          )}
          {filters.equipoFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Equipo: {filters.equipoFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, equipoFilter: "" })
                }
              />
            </Badge>
          )}
          {filters.marcaFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Marca: {filters.marcaFilter}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, marcaFilter: "" })}
              />
            </Badge>
          )}
          {filters.estadoFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Estado: {filters.estadoFilter.replace("_", " ")}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ ...filters, estadoFilter: "" })
                }
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
