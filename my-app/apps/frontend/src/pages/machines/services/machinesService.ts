import {
  Machine,
  CreateMachineDto,
  UpdateMachineDto,
  MachineFilters,
  MachineStats,
  ApiResponse,
} from "../models/types";

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const MACHINES_ENDPOINT = `${API_BASE_URL}/machines`;

// Función para obtener headers con autenticación
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log("🔑 Token agregado a headers");
  } else {
    console.warn("⚠️ No se encontró token en localStorage");
  }

  return headers;
}

// Función auxiliar para manejar respuestas de la API
async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  console.log("🔍 Procesando respuesta de la API...");

  try {
    const data = await response.json();
    console.log("📄 Datos JSON recibidos:", data);

    if (!response.ok) {
      console.error("❌ Respuesta no exitosa:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });

      return {
        success: false,
        error:
          data.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    console.log("✅ Respuesta procesada exitosamente");
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("❌ Error al procesar JSON:", error);
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

class MachinesService {
  // Obtener todas las máquinas
  async getAllMachines(): Promise<ApiResponse<Machine[]>> {
    console.log("🚀 MachinesService: Iniciando getAllMachines()");
    console.log("🔗 URL de la API:", MACHINES_ENDPOINT);

    try {
      console.log("📡 Realizando fetch a:", MACHINES_ENDPOINT);

      const response = await fetch(MACHINES_ENDPOINT, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      console.log("📥 Respuesta recibida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
      });

      const result = await handleApiResponse<Machine[]>(response);
      console.log("✅ Resultado procesado:", result);

      return result;
    } catch (error) {
      console.error("❌ Error en getAllMachines:", error);
      return handleNetworkError(error);
    }
  }

  // Obtener una máquina por ID
  async getMachineById(id: number): Promise<ApiResponse<Machine>> {
    try {
      const response = await fetch(`${MACHINES_ENDPOINT}/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      return await handleApiResponse<Machine>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Crear una nueva máquina
  async createMachine(
    machineData: CreateMachineDto
  ): Promise<ApiResponse<Machine>> {
    try {
      const response = await fetch(MACHINES_ENDPOINT, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(machineData),
      });

      return await handleApiResponse<Machine>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Actualizar una máquina
  async updateMachine(
    id: number,
    machineData: UpdateMachineDto
  ): Promise<ApiResponse<Machine>> {
    try {
      const response = await fetch(`${MACHINES_ENDPOINT}/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(machineData),
      });

      return await handleApiResponse<Machine>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Eliminar una máquina
  async deleteMachine(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${MACHINES_ENDPOINT}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      return await handleApiResponse<void>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Buscar máquinas con filtros
  async getMachinesWithFilters(
    filters: MachineFilters
  ): Promise<ApiResponse<Machine[]>> {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, String(value));
        }
      });

      const url = `${MACHINES_ENDPOINT}/filter?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      return await handleApiResponse<Machine[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Obtener máquinas por modelo
  async getMachinesByModelo(modeloId: number): Promise<ApiResponse<Machine[]>> {
    try {
      const response = await fetch(`${MACHINES_ENDPOINT}/modelo/${modeloId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      return await handleApiResponse<Machine[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Obtener máquinas por estado
  async getMachinesByEstado(estado: string): Promise<ApiResponse<Machine[]>> {
    try {
      const response = await fetch(`${MACHINES_ENDPOINT}/estado/${estado}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      return await handleApiResponse<Machine[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  // Obtener estadísticas de máquinas
  async getMachineStatistics(): Promise<ApiResponse<MachineStats>> {
    try {
      const response = await fetch(`${MACHINES_ENDPOINT}/statistics`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      return await handleApiResponse<MachineStats>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }
}

// Exportar una instancia singleton del servicio
export const machinesService = new MachinesService();

// También exportar la clase para testing o casos especiales
export { MachinesService };
