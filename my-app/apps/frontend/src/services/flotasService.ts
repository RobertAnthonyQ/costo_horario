import { ApiResponse } from "@/types/api";

const BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

export interface Flota {
  id: number;
  nombre: string;
  created_at?: string;
  modelos?: any[];
  _count?: {
    modelos: number;
  };
}

export interface CreateFlotaDto {
  nombre: string;
}

export interface UpdateFlotaDto {
  nombre?: string;
}

class FlotasService {
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

  async getFlotas(): Promise<ApiResponse<Flota[]>> {
    return this.fetchApi<Flota[]>("/flotas");
  }

  async getFlota(id: number): Promise<ApiResponse<Flota>> {
    return this.fetchApi<Flota>(`/flotas/${id}`);
  }

  async createFlota(data: CreateFlotaDto): Promise<ApiResponse<Flota>> {
    return this.fetchApi<Flota>("/flotas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateFlota(
    id: number,
    data: UpdateFlotaDto
  ): Promise<ApiResponse<Flota>> {
    return this.fetchApi<Flota>(`/flotas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteFlota(id: number): Promise<ApiResponse<void>> {
    return this.fetchApi<void>(`/flotas/${id}`, {
      method: "DELETE",
    });
  }

  async getStatistics(): Promise<ApiResponse<any>> {
    return this.fetchApi<any>("/flotas/statistics");
  }
}

export const flotasService = new FlotasService();
