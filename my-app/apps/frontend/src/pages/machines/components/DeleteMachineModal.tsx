import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Machine } from "../models/types";
import { machinesService } from "../services/machinesService";

interface DeleteMachineModalProps {
  isOpen: boolean;
  machine: Machine | null;
  onClose: () => void;
  onSuccess?: (machineId: number) => void;
}

export const DeleteMachineModal: React.FC<DeleteMachineModalProps> = ({
  isOpen,
  machine,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleDelete = async () => {
    if (!machine) {
      setError("No se ha seleccionado una máquina para eliminar");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await machinesService.deleteMachine(machine.id);

      if (response.success) {
        // Llamar al callback de éxito si está definido
        if (onSuccess) {
          onSuccess(machine.id);
        }

        // Cerrar el modal
        onClose();
      } else {
        setError(response.error || "Error al eliminar la máquina");
      }
    } catch (error: any) {
      setError(error.message || "Error inesperado al eliminar la máquina");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError("");
    }
  };

  // Generar información de la máquina para mostrar en el modal
  const getMachineInfo = () => {
    if (!machine) return "esta máquina";

    const modeloInfo = machine.modelo
      ? `${machine.modelo.marca?.nombre} ${machine.modelo.nombre}`
      : `Máquina ID: ${machine.id}`;

    return modeloInfo;
  };

  const getMachineDetails = () => {
    if (!machine) return "";

    const details = [];

    if (machine.modelo) {
      details.push(`Modelo: ${machine.modelo.nombre}`);
      if (machine.modelo.marca) {
        details.push(`Marca: ${machine.modelo.marca.nombre}`);
      }
      if (machine.modelo.equipo) {
        details.push(`Equipo: ${machine.modelo.equipo.nombre}`);
      }
    }

    if (machine.estado) {
      details.push(`Estado: ${machine.estado}`);
    }

    if (machine.horometro_inicial) {
      details.push(`Horómetro: ${machine.horometro_inicial} hrs`);
    }

    return details.join(" • ");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar eliminación
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar{" "}
            <strong>{getMachineInfo()}</strong>?
            {getMachineDetails() && (
              <div className="mt-2 text-sm text-muted-foreground">
                {getMachineDetails()}
              </div>
            )}
            <div className="mt-3 p-3 bg-destructive/10 rounded-md border border-destructive/20">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Esta acción no se puede deshacer
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                Se eliminarán todos los datos relacionados con esta máquina.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Mensaje de error */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
