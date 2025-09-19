import React, { useState, useEffect } from "react";
import { CrudTable } from "./CrudTable";
import { Badge } from "@/components/ui/badge";
import {
  equiposService,
  Equipo,
  CreateEquipoDto,
  UpdateEquipoDto,
} from "@/services/equiposService";

export const EquiposManagement: React.FC = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadEquipos = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await equiposService.getEquipos();
      if (response.success && response.data) {
        setEquipos(response.data);
      } else {
        setError(response.error || "Error al cargar equipos");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar equipos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipos();
  }, []);

  const handleAdd = async (data: CreateEquipoDto) => {
    const response = await equiposService.createEquipo(data);
    if (!response.success) {
      throw new Error(response.error || "Error al crear equipo");
    }
  };

  const handleEdit = async (id: number, data: UpdateEquipoDto) => {
    const response = await equiposService.updateEquipo(id, data);
    if (!response.success) {
      throw new Error(response.error || "Error al actualizar equipo");
    }
  };

  const handleDelete = async (id: number) => {
    const response = await equiposService.deleteEquipo(id);
    if (!response.success) {
      throw new Error(response.error || "Error al eliminar equipo");
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
      render: (value: any, item: Equipo) => (
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
      key: "nombre" as keyof Equipo,
      label: "Nombre del Equipo",
      type: "text" as const,
      required: true,
      placeholder: "Ej: Excavadora, Bulldozer, Cargador Frontal",
    },
  ];

  return (
    <CrudTable
      title="Equipos"
      description="Administre los tipos de equipos disponibles en el sistema"
      items={equipos}
      columns={columns}
      loading={loading}
      error={error}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={loadEquipos}
      formFields={formFields}
    />
  );
};
