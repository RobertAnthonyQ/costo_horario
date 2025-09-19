import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, MoreVertical, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Machine } from "../models/types";
import {
  getStatusColor,
  formatCurrency,
  formatHours,
  getMachineCode,
  getMachineLocation,
} from "../models/data";

interface MachineGridProps {
  machines: Machine[];
  onEdit?: (machine: Machine) => void;
  onDelete?: (machine: Machine) => void;
  onView?: (machine: Machine) => void;
}

export const MachineGrid = ({
  machines,
  onEdit,
  onDelete,
  onView,
}: MachineGridProps) => {
  const handleEdit = (machine: Machine) => {
    if (onEdit) onEdit(machine);
  };

  const handleDelete = (machine: Machine) => {
    if (onDelete) onDelete(machine);
  };

  const handleView = (machine: Machine) => {
    if (onView) onView(machine);
  };

  const formatEstado = (estado: string | undefined) => {
    if (!estado) return "N/A";
    return estado.charAt(0).toUpperCase() + estado.slice(1).replace("_", " ");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {machines.map((machine) => (
        <Card
          key={machine.id}
          className="group hover:shadow-lg transition-shadow"
        >
          <div className="relative">
            <img
              src={machine.link_imagen || "/src/assets/hero-machinery.jpg"}
              alt={`${machine.modelo?.marca?.nombre} ${machine.modelo?.nombre}`}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/src/assets/hero-machinery.jpg";
              }}
            />
            <div className="absolute top-2 right-2">
              <Badge className={getStatusColor(machine.estado || "")}>
                {formatEstado(machine.estado)}
              </Badge>
            </div>
            <div className="absolute top-2 left-2">
              <Badge
                variant="secondary"
                className="bg-background/80 text-foreground"
              >
                {getMachineCode(machine)}
              </Badge>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg truncate">
                {machine.modelo?.equipo?.nombre || "Nombre N/A"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {machine.modelo?.nombre || "Modelo N/A"}
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Flota:</span>
                <span className="font-medium">
                  {machine.modelo?.flota?.nombre || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Valor de Venta:</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(machine.valor_venta)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Tiempo de Entrega:
                </span>
                <span className="font-medium">
                  {machine.tiempo_entrega
                    ? `${machine.tiempo_entrega} meses`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Valor Similar Nuevo:
                </span>
                <span className="font-medium">
                  {formatCurrency(machine.valor_similar_nuevo)}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleView(machine)}
              >
                <Eye className="mr-1 h-3 w-3" />
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleEdit(machine)}
              >
                <Edit className="mr-1 h-3 w-3" />
                Editar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem>
                    <Plus className="mr-2 h-4 w-4" />
                    Calcular costos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(machine)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
