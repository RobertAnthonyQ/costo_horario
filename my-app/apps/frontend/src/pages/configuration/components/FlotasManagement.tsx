import React, { useState, useEffect } from "react";
import { CrudTable } from "./CrudTable";
import { Badge } from "@/components/ui/badge";
import {
  flotasService,
  Flota,
  CreateFlotaDto,
  UpdateFlotaDto,
} from "@/services/flotasService";

export const FlotasManagement: React.FC = () => {
  const [flotas, setFlotas] = useState<Flota[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadFlotas = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await flotasService.getFlotas();
      if (response.success && response.data) {
        setFlotas(response.data);
      } else {
        setError(response.error || "Error al cargar flotas");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar flotas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlotas();
  }, []);

  const handleAdd = async (data: CreateFlotaDto) => {
    const response = await flotasService.createFlota(data);
    if (!response.success) {
      throw new Error(response.error || "Error al crear flota");
    }
  };

  const handleEdit = async (id: number, data: UpdateFlotaDto) => {
    const response = await flotasService.updateFlota(id, data);
    if (!response.success) {
      throw new Error(response.error || "Error al actualizar flota");
    }
  };

  const handleDelete = async (id: number) => {
    const response = await flotasService.deleteFlota(id);
    if (!response.success) {
      throw new Error(response.error || "Error al eliminar flota");
    }
  };

  const columns = [
    {
      key: "nombre",
      label: "Nombre",
    },
    {
      key: "modelos_count",
      label: "Modelos",
      render: (value: any, item: Flota) => (
        <Badge variant="secondary">
          {item._count?.modelos || item.modelos?.length || 0} modelos
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Fecha de Creación",
      render: (value: string) => {
        if (!value) return "-";
        return new Date(value).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
  ];

  const formFields = [
    {
      key: "nombre" as keyof Flota,
      label: "Nombre de la Flota",
      type: "text" as const,
      required: true,
      placeholder: "Ej: Flota Minería, Flota Construcción, Flota Forestal",
    },
  ];

  return (
    <CrudTable
      title="Flotas"
      description="Administre las flotas de equipos disponibles en el sistema"
      items={flotas}
      columns={columns}
      loading={loading}
      error={error}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={loadFlotas}
      formFields={formFields}
    />
  );
};
