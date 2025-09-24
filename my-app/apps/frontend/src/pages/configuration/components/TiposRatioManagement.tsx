import React, { useState, useEffect } from "react";
import { CrudTable } from "./CrudTable";
import { Badge } from "@/components/ui/badge";
import {
  tiposRatioService,
  TipoRatio,
  TipoRatioCategoria,
  CreateTipoRatioDto,
  UpdateTipoRatioDto,
} from "@/services/tiposRatioService";

export const TiposRatioManagement: React.FC = () => {
  const [tiposRatio, setTiposRatio] = useState<TipoRatio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadTiposRatio = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await tiposRatioService.getTiposRatio();
      if (response.success && response.data) {
        setTiposRatio(response.data);
      } else {
        setError(response.error || "Error al cargar tipos de ratio");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar tipos de ratio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTiposRatio();
  }, []);

  const handleAdd = async (data: any) => {
    // Filtrar propiedades vacías y campos no válidos
    const cleanData: CreateTipoRatioDto = {
      nombre: data.nombre.trim(),
    };

    if (
      data.categoria &&
      data.categoria !== "" &&
      data.categoria !== "EMPTY_VALUE"
    ) {
      cleanData.categoria = data.categoria;
    }

    const response = await tiposRatioService.createTipoRatio(cleanData);
    if (!response.success) {
      throw new Error(response.error || "Error al crear tipo de ratio");
    }
  };

  const handleEdit = async (id: number, data: any) => {
    // Filtrar propiedades vacías y campos no válidos
    const cleanData: UpdateTipoRatioDto = {};

    if (data.nombre && data.nombre.trim() !== "") {
      cleanData.nombre = data.nombre.trim();
    }

    if (
      data.categoria &&
      data.categoria !== "" &&
      data.categoria !== "EMPTY_VALUE"
    ) {
      cleanData.categoria = data.categoria;
    }

    const response = await tiposRatioService.updateTipoRatio(id, cleanData);
    if (!response.success) {
      throw new Error(response.error || "Error al actualizar tipo de ratio");
    }
  };

  const handleDelete = async (id: number) => {
    const response = await tiposRatioService.deleteTipoRatio(id);
    if (!response.success) {
      throw new Error(response.error || "Error al eliminar tipo de ratio");
    }
  };

  const getCategoriaColor = (categoria?: TipoRatioCategoria) => {
    if (!categoria) return "default";

    const colorMap = {
      [TipoRatioCategoria.Preventivo]: "default",
      [TipoRatioCategoria.Correctivo]: "destructive",
      [TipoRatioCategoria.Neumaticos]: "secondary",
      [TipoRatioCategoria.Estructural]: "outline",
      [TipoRatioCategoria.Desgaste]: "default",
    };

    return colorMap[categoria] || "default";
  };

  const columns = [
    {
      key: "nombre",
      label: "Nombre",
    },
    {
      key: "categoria",
      label: "Categoría",
      render: (value: TipoRatioCategoria | undefined, item: TipoRatio) => (
        <Badge variant={getCategoriaColor(value) as any}>
          {value || "Sin categoría"}
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
      key: "nombre" as keyof TipoRatio,
      label: "Nombre del Tipo de Ratio",
      type: "text" as const,
      required: true,
      placeholder: "Ej: Disponibilidad, Utilización, Rendimiento",
    },
    {
      key: "categoria" as keyof TipoRatio,
      label: "Categoría",
      type: "select" as const,
      required: false,
      placeholder: "Seleccionar categoría",
      options: [
        { value: "", label: "Sin categoría" },
        { value: TipoRatioCategoria.Preventivo, label: "Preventivo" },
        { value: TipoRatioCategoria.Correctivo, label: "Correctivo" },
        { value: TipoRatioCategoria.Neumaticos, label: "Neumáticos" },
        { value: TipoRatioCategoria.Estructural, label: "Estructural" },
        { value: TipoRatioCategoria.Desgaste, label: "Desgaste" },
      ],
    },
  ];

  return (
    <CrudTable
      title="Tipos de Ratio"
      description="Administre los tipos de ratios disponibles para el análisis de equipos"
      items={tiposRatio}
      columns={columns}
      loading={loading}
      error={error}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefresh={loadTiposRatio}
      formFields={formFields}
    />
  );
};
