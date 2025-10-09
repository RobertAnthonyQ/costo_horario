import React, { useState, useEffect } from "react";
import { CrudTable } from "./CrudTable";
import { Badge } from "@/components/ui/badge";
import {
  componentesService,
  Componente,
  CreateComponenteDto,
  UpdateComponenteDto,
} from "@/services/componentesService";

export const ComponentesManagement: React.FC = () => {
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadComponentes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await componentesService.getComponentes();
      if (response.success && response.data) {
        setComponentes(response.data);
      } else {
        setError(response.error || "Error al cargar componentes");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar componentes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComponentes();
  }, []);

  const handleAdd = async (data: CreateComponenteDto) => {
    const response = await componentesService.createComponente(data);
    if (!response.success) {
      throw new Error(response.error || "Error al crear componente");
    }
  };

  const handleEdit = async (id: number, data: UpdateComponenteDto) => {
    // Filter only the fields that are allowed in UpdateComponenteDto
    const filteredData: UpdateComponenteDto = {
      nombre: data.nombre,
    };

    const response = await componentesService.updateComponente(
      id,
      filteredData
    );
    if (!response.success) {
      throw new Error(response.error || "Error al actualizar componente");
    }
  };

  const handleDelete = async (id: number) => {
    const response = await componentesService.deleteComponente(id);
    if (!response.success) {
      throw new Error(response.error || "Error al eliminar componente");
    }
  };

  const columns = [
    {
      key: "nombre",
      label: "Nombre",
    },
    {
      key: "historicos_count",
      label: "Registros Históricos",
      render: (value: any, item: Componente) => (
        <Badge variant="secondary">
          {item._count?.modelo_componentes_historico ||
            item.modelo_componentes_historico?.length ||
            0}{" "}
          registros
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
      key: "nombre" as keyof Componente,
      label: "Nombre del Componente",
      type: "text" as const,
      required: true,
      placeholder: "Ej: Motor, Transmisión, Hidráulico, Neumáticos",
    },
  ];

  return (
    <CrudTable
      title="Componentes"
      description="Administre los componentes de equipos disponibles en el sistema"
      items={componentes}
      columns={columns}
      loading={loading}
      error={error}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={loadComponentes}
      formFields={formFields}
    />
  );
};
