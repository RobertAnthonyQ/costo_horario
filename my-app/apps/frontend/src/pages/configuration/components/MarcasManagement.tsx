import React, { useState, useEffect } from "react";
import { CrudTable } from "./CrudTable";
import { Badge } from "@/components/ui/badge";
import {
  marcasService,
  Marca,
  CreateMarcaDto,
  UpdateMarcaDto,
} from "@/services/marcasService";

export const MarcasManagement: React.FC = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadMarcas = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await marcasService.getMarcas();
      if (response.success && response.data) {
        setMarcas(response.data);
      } else {
        setError(response.error || "Error al cargar marcas");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar marcas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarcas();
  }, []);

  const handleAdd = async (data: CreateMarcaDto) => {
    const response = await marcasService.createMarca(data);
    if (!response.success) {
      throw new Error(response.error || "Error al crear marca");
    }
  };

  const handleEdit = async (id: number, data: UpdateMarcaDto) => {
    const response = await marcasService.updateMarca(id, data);
    if (!response.success) {
      throw new Error(response.error || "Error al actualizar marca");
    }
  };

  const handleDelete = async (id: number) => {
    const response = await marcasService.deleteMarca(id);
    if (!response.success) {
      throw new Error(response.error || "Error al eliminar marca");
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
      render: (value: any, item: Marca) => (
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
      key: "nombre" as keyof Marca,
      label: "Nombre de la Marca",
      type: "text" as const,
      required: true,
      placeholder: "Ej: Caterpillar, Komatsu, Volvo",
    },
  ];

  return (
    <CrudTable
      title="Marcas"
      description="Administre las marcas de equipos disponibles en el sistema"
      items={marcas}
      columns={columns}
      loading={loading}
      error={error}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={loadMarcas}
      formFields={formFields}
    />
  );
};
