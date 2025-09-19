import { ApiResponse } from "@/types/api";

const BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

export interface Componente {
  id: number;
  nombre: string;
  created_at?: string;
  modelo_componentes_historico?: any[];
  _count?: {
    modelo_componentes_historico: number;
  };
}

export interface CreateComponenteDto {
  nombre: string;
}

export interface UpdateComponenteDto {
  nombre?: string;
}

class ComponentesService {
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

  async getComponentes(): Promise<ApiResponse<Componente[]>> {
    return this.fetchApi<Componente[]>("/componentes");
  }

  async getComponente(id: number): Promise<ApiResponse<Componente>> {
    return this.fetchApi<Componente>(`/componentes/${id}`);
  }

  async createComponente(
    data: CreateComponenteDto
  ): Promise<ApiResponse<Componente>> {
    return this.fetchApi<Componente>("/componentes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateComponente(
    id: number,
    data: UpdateComponenteDto
  ): Promise<ApiResponse<Componente>> {
    return this.fetchApi<Componente>(`/componentes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteComponente(id: number): Promise<ApiResponse<void>> {
    return this.fetchApi<void>(`/componentes/${id}`, {
      method: "DELETE",
    });
  }

  async getStatistics(): Promise<ApiResponse<any>> {
    return this.fetchApi<any>("/componentes/statistics");
  }

  async getByModelo(modeloId: number): Promise<ApiResponse<Componente[]>> {
    return this.fetchApi<Componente[]>(`/componentes/modelo/${modeloId}`);
  }
}

export const componentesService = new ComponentesService();
