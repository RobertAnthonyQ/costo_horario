import { ApiResponse } from "@/types/api";

const BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

export interface Equipo {
  id: number;
  nombre: string;
  created_at?: string;
  modelos?: any[];
  _count?: {
    modelos: number;
  };
}

export interface CreateEquipoDto {
  nombre: string;
}

export interface UpdateEquipoDto {
  nombre?: string;
}

class EquiposService {
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

  async getEquipos(): Promise<ApiResponse<Equipo[]>> {
    return this.fetchApi<Equipo[]>("/equipos");
  }

  async getEquipo(id: number): Promise<ApiResponse<Equipo>> {
    return this.fetchApi<Equipo>(`/equipos/${id}`);
  }

  async createEquipo(data: CreateEquipoDto): Promise<ApiResponse<Equipo>> {
    return this.fetchApi<Equipo>("/equipos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEquipo(
    id: number,
    data: UpdateEquipoDto
  ): Promise<ApiResponse<Equipo>> {
    return this.fetchApi<Equipo>(`/equipos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteEquipo(id: number): Promise<ApiResponse<void>> {
    return this.fetchApi<void>(`/equipos/${id}`, {
      method: "DELETE",
    });
  }

  async getStatistics(): Promise<ApiResponse<any>> {
    return this.fetchApi<any>("/equipos/statistics");
  }
}

export const equiposService = new EquiposService();
