import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, MoreVertical, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface MachineTableProps {
  machines: Machine[];
  onEdit?: (machine: Machine) => void;
  onDelete?: (machine: Machine) => void;
  onView?: (machine: Machine) => void;
}

export const MachineTable = ({
  machines,
  onEdit,
  onDelete,
  onView,
}: MachineTableProps) => {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Marca</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Modelo</TableHead>
          <TableHead>Equipo</TableHead>
          <TableHead>Tiempo de Entrega</TableHead>
          <TableHead>Valor de Adquisición</TableHead>
          <TableHead>Vida Útil del Fabricante</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {machines.map((machine) => (
          <TableRow key={machine.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">
              {machine.modelo?.marca?.nombre || "N/A"}
            </TableCell>
            <TableCell className="font-medium">
              {machine.modelo?.equipo?.nombre || "N/A"}
            </TableCell>
            <TableCell>{machine.modelo?.nombre || "N/A"}</TableCell>
            <TableCell>{machine.modelo?.equipo?.nombre || "N/A"}</TableCell>
            <TableCell>
              {machine.tiempo_entrega
                ? `${machine.tiempo_entrega} meses`
                : "N/A"}
            </TableCell>
            <TableCell className="font-semibold text-primary">
              {formatCurrency(machine.valor_similar_nuevo)}
            </TableCell>
            <TableCell>
              {machine.modelo?.vida_util_fabricante
                ? `${machine.modelo.vida_util_fabricante.toLocaleString()} hrs`
                : "N/A"}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => handleView(machine)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(machine)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
