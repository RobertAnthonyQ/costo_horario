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
import { CreateMachineDto, Machine } from "../models/types";
import { machinesService } from "../services/machinesService";

interface CreateMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (machine: Machine) => void;
}

export const CreateMachineModal: React.FC<CreateMachineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (data: CreateMachineDto) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await machinesService.createMachine(data);

      if (response.success && response.data) {
        setSuccess("Máquina creada exitosamente");

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
        setError(response.error || "Error al crear la máquina");
      }
    } catch (error: any) {
      setError(error.message || "Error inesperado al crear la máquina");
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Máquina</DialogTitle>
          <DialogDescription>
            Completa los datos para agregar una nueva máquina a la flota.
          </DialogDescription>
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

        {/* Formulario */}
        <MachineForm
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};
