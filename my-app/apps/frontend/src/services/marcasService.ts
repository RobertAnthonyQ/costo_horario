import { ApiResponse } from "@/types/api";

const BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

export interface Marca {
  id: number;
  nombre: string;
  created_at?: string;
  modelos?: any[];
  _count?: {
    modelos: number;
  };
}

export interface CreateMarcaDto {
  nombre: string;
}

export interface UpdateMarcaDto {
  nombre?: string;
}

class MarcasService {
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

  async getMarcas(): Promise<ApiResponse<Marca[]>> {
    return this.fetchApi<Marca[]>("/marcas");
  }

  async getMarca(id: number): Promise<ApiResponse<Marca>> {
    return this.fetchApi<Marca>(`/marcas/${id}`);
  }

  async createMarca(data: CreateMarcaDto): Promise<ApiResponse<Marca>> {
    return this.fetchApi<Marca>("/marcas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMarca(
    id: number,
    data: UpdateMarcaDto
  ): Promise<ApiResponse<Marca>> {
    return this.fetchApi<Marca>(`/marcas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteMarca(id: number): Promise<ApiResponse<void>> {
    return this.fetchApi<void>(`/marcas/${id}`, {
      method: "DELETE",
    });
  }

  async getStatistics(): Promise<ApiResponse<any>> {
    return this.fetchApi<any>("/marcas/statistics");
  }
}

export const marcasService = new MarcasService();
