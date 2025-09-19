import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { MachineForm } from "./MachineForm";
import { UpdateMachineDto, Machine } from "../models/types";
import { machinesService } from "../services/machinesService";

interface EditMachineModalProps {
  isOpen: boolean;
  machine: Machine | null;
  onClose: () => void;
  onSuccess?: (machine: Machine) => void;
}

export const EditMachineModal: React.FC<EditMachineModalProps> = ({
  isOpen,
  machine,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (data: UpdateMachineDto) => {
    if (!machine) {
      setError("No se ha seleccionado una máquina para editar");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await machinesService.updateMachine(machine.id, data);

      if (response.success && response.data) {
        setSuccess("Máquina actualizada exitosamente");

        // Llamar al callback de éxito si está definido
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Cerrar el modal después de un breve delay para mostrar el mensaje de éxito
        setTimeout(() => {
          onClose();
          setSuccess("");
        }, 1500);
      } else {
        setError(response.error || "Error al actualizar la máquina");
      }
    } catch (error: any) {
      setError(error.message || "Error inesperado al actualizar la máquina");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      // Limpiar estados al cerrar
      setError("");
      setSuccess("");
    }
  };

  // Generar el título dinámico basado en la información de la máquina
  const getModalTitle = () => {
    if (!machine) return "Editar Máquina";

    const modeloInfo = machine.modelo
      ? `${machine.modelo.marca?.nombre} ${machine.modelo.nombre}`
      : "Máquina";

    return `Editar ${modeloInfo}`;
  };

  const getModalDescription = () => {
    if (!machine) return "Modifica los datos de la máquina.";

    return `ID: ${machine.id} - Modifica los datos de esta máquina.`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>

        {/* Mensaje de éxito */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Mensaje de error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulario - Solo se renderiza si hay una máquina seleccionada */}
        {machine && (
          <MachineForm
            machine={machine}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isLoading={isLoading}
          />
        )}

        {/* Mensaje si no hay máquina seleccionada */}
        {!machine && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se ha seleccionado una máquina para editar.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};
