import { Marca, Equipo, Flota, Modelo, ApiResponse } from "../models/types";

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Función auxiliar para manejar respuestas de la API
async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al procesar la respuesta del servidor",
    };
  }
}

// Función auxiliar para manejar errores de red
function handleNetworkError(error: any): ApiResponse<any> {
  console.error("Network error:", error);
  return {
    success: false,
    error: "Error de conexión. Por favor, verifica tu conexión a internet.",
  };
}

class RelationsService {
  // Obtener todas las marcas
  async getMarcas(): Promise<ApiResponse<Marca[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/marcas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await handleApiResponse<Marca[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Obtener todos los equipos
  async getEquipos(): Promise<ApiResponse<Equipo[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/equipos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await handleApiResponse<Equipo[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Obtener todas las flotas
  async getFlotas(): Promise<ApiResponse<Flota[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/flotas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await handleApiResponse<Flota[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Obtener todos los modelos
  async getModelos(): Promise<ApiResponse<Modelo[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/modelos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await handleApiResponse<Modelo[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Obtener modelos por marca
  async getModelosByMarca(marcaId: number): Promise<ApiResponse<Modelo[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/modelos/marca/${marcaId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await handleApiResponse<Modelo[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Obtener modelos por equipo
  async getModelosByEquipo(equipoId: number): Promise<ApiResponse<Modelo[]>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/modelos/equipo/${equipoId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return await handleApiResponse<Modelo[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Obtener un modelo específico con sus relaciones
  async getModeloById(id: number): Promise<ApiResponse<Modelo>> {
    try {
      const response = await fetch(`${API_BASE_URL}/modelos/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await handleApiResponse<Modelo>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }
}

// Exportar una instancia singleton del servicio
export const relationsService = new RelationsService();

// También exportar la clase para testing o casos especiales
export { RelationsService };
