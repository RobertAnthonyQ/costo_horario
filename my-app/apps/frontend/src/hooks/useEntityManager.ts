import { useState, useCallback } from "react";
import { ApiResponse } from "@/types/api";

export interface UseEntityManagerOptions<T, CreateDto, UpdateDto> {
  fetchAll: () => Promise<ApiResponse<T[]>>;
  create: (data: CreateDto) => Promise<ApiResponse<T>>;
  update: (id: number, data: UpdateDto) => Promise<ApiResponse<T>>;
  delete: (id: number) => Promise<ApiResponse<void>>;
  entityName: string;
}

export function useEntityManager<T, CreateDto, UpdateDto>({
  fetchAll,
  create,
  update,
  delete: deleteEntity,
  entityName,
}: UseEntityManagerOptions<T, CreateDto, UpdateDto>) {
  const [entities, setEntities] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadEntities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchAll();
      if (response.success && response.data) {
        setEntities(response.data);
      } else {
        setError(response.error || `Error al cargar ${entityName}`);
      }
    } catch (err: any) {
      setError(err.message || `Error al cargar ${entityName}`);
    } finally {
      setLoading(false);
    }
  }, [fetchAll, entityName]);

  const handleAdd = useCallback(
    async (data: CreateDto) => {
      const response = await create(data);
      if (!response.success) {
        throw new Error(response.error || `Error al crear ${entityName}`);
      }
      return response.data;
    },
    [create, entityName]
  );

  const handleUpdate = useCallback(
    async (id: number, data: UpdateDto) => {
      const response = await update(id, data);
      if (!response.success) {
        throw new Error(response.error || `Error al actualizar ${entityName}`);
      }
      return response.data;
    },
    [update, entityName]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      const response = await deleteEntity(id);
      if (!response.success) {
        throw new Error(response.error || `Error al eliminar ${entityName}`);
      }
    },
    [deleteEntity, entityName]
  );

  return {
    entities,
    loading,
    error,
    loadEntities,
    handleAdd,
    handleUpdate,
    handleDelete,
    setError,
  };
}

export default useEntityManager;
