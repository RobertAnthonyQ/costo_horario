import { ApiResponse } from "@/types/api";

const BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

export enum TipoRatioCategoria {
  Preventivo = "Preventivo",
  Correctivo = "Correctivo",
  Neumaticos = "Neumaticos",
  Estructural = "Estructural",
  Desgaste = "Desgaste",
}

export interface TipoRatio {
  id: number;
  nombre: string;
  categoria?: TipoRatioCategoria;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTipoRatioDto {
  nombre: string;
  categoria?: TipoRatioCategoria;
}

export interface UpdateTipoRatioDto {
  nombre?: string;
  categoria?: TipoRatioCategoria;
}

class TiposRatioService {
  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Error en la solicitud",
          data: null,
        };
      }

      return {
        success: true,
        data: data,
        error: null,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Error de conexión",
        data: null,
      };
    }
  }

  async getTiposRatio(): Promise<ApiResponse<TipoRatio[]>> {
    return this.fetchApi<TipoRatio[]>("/tipos-ratio");
  }

  async getTipoRatio(id: number): Promise<ApiResponse<TipoRatio>> {
    return this.fetchApi<TipoRatio>(`/tipos-ratio/${id}`);
  }

  async createTipoRatio(
    data: CreateTipoRatioDto
  ): Promise<ApiResponse<TipoRatio>> {
    return this.fetchApi<TipoRatio>("/tipos-ratio", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTipoRatio(
    id: number,
    data: UpdateTipoRatioDto
  ): Promise<ApiResponse<TipoRatio>> {
    return this.fetchApi<TipoRatio>(`/tipos-ratio/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTipoRatio(id: number): Promise<ApiResponse<void>> {
    return this.fetchApi<void>(`/tipos-ratio/${id}`, {
      method: "DELETE",
    });
  }
}

export const tiposRatioService = new TiposRatioService();
