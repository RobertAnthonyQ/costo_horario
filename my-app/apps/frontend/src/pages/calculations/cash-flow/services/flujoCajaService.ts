import {
  ApiResponse,
  FlujoCajaInput,
  FlujoCajaResponse,
  FlujoCajaVersion,
} from "../models/types";
import { getAuthHeaders } from "@/utils/authUtils";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const ENDPOINT = `${API_BASE_URL}/calculos/flujo-caja`;

async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();
    if (!response.ok) {
      // Manejo más detallado de errores
      const errorMessage =
        data?.message || data?.error || `Error HTTP ${response.status}`;
      console.error("❌ Error de API:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
    return { success: true, data };
  } catch (e) {
    console.error("❌ Error al parsear respuesta JSON:", e);
    return {
      success: false,
      error: "Error al procesar la respuesta del servidor",
    };
  }
}

function handleNetworkError(error: any): ApiResponse<any> {
  console.error("🚨 Network error:", error);

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      success: false,
      error: "Error de conexión. Verifica que el servidor esté corriendo.",
    };
  }

  return {
    success: false,
    error: error.message || "Error de conexión. Verifica tu internet.",
  };
}

class FlujoCajaService {
  /**
   * Calcula el preview del análisis de flujo de caja
   */
  async previewAnalisis(
    input: FlujoCajaInput
  ): Promise<ApiResponse<FlujoCajaResponse>> {
    try {
      console.log("🌐 Enviando petición preview a:", `${ENDPOINT}/preview`);
      console.log("📋 Input enviado:", JSON.stringify(input, null, 2));

      const response = await fetch(`${ENDPOINT}/preview`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
      });

      console.log("📡 Response status:", response.status);
      const result = await handleApiResponse<FlujoCajaResponse>(response);
      console.log("📊 Result recibido:", result);

      return result;
    } catch (error) {
      console.error("🚨 Error en previewAnalisis:", error);
      return handleNetworkError(error);
    }
  }

  /**
   * Guarda el análisis de flujo de caja
   */
  async guardarAnalisis(
    input: FlujoCajaInput
  ): Promise<ApiResponse<FlujoCajaResponse>> {
    try {
      console.log("🌐 Enviando petición guardar a:", `${ENDPOINT}/guardar`);
      console.log("📋 Input enviado:", JSON.stringify(input, null, 2));

      const response = await fetch(`${ENDPOINT}/guardar`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
      });

      console.log("📡 Response status:", response.status);
      const result = await handleApiResponse<FlujoCajaResponse>(response);
      console.log("📊 Result recibido:", result);

      return result;
    } catch (error) {
      console.error("🚨 Error en guardarAnalisis:", error);
      return handleNetworkError(error);
    }
  }

  /**
   * Obtiene todas las versiones de análisis
   */
  async getVersiones(
    machineId?: number
  ): Promise<ApiResponse<FlujoCajaVersion[]>> {
    try {
      const url = machineId
        ? `${ENDPOINT}/versiones?machineId=${machineId}`
        : `${ENDPOINT}/versiones`;

      console.log("🌐 Obteniendo versiones desde:", url);

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      const result = await handleApiResponse<FlujoCajaVersion[]>(response);

      console.log("📊 Versiones recibidas:", result);
      return result;
    } catch (error) {
      console.error("🚨 Error en getVersiones:", error);
      return handleNetworkError(error);
    }
  }

  /**
   * Obtiene un análisis por ID
   */
  async getAnalisisById(id: number): Promise<ApiResponse<FlujoCajaResponse>> {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`, {
        headers: getAuthHeaders(),
      });
      return await handleApiResponse<FlujoCajaResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  /**
   * Obtiene todos los análisis
   */
  async getTodosAnalisis(): Promise<ApiResponse<FlujoCajaResponse[]>> {
    try {
      const response = await fetch(`${ENDPOINT}/todos`, {
        headers: getAuthHeaders(),
      });
      return await handleApiResponse<FlujoCajaResponse[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  /**
   * Obtiene parámetros de amortización para una máquina
   * Usa el último informe de costo horario de la máquina
   */
  async getParametrosAmortizacion(
    machineId: number
  ): Promise<ApiResponse<any>> {
    try {
      console.log(
        "🌐 Obteniendo parámetros de amortización para máquina:",
        machineId
      );

      const response = await fetch(`${ENDPOINT}/amortizacion/parametros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId }),
      });

      const result = await handleApiResponse<any>(response);
      console.log("📊 Parámetros de amortización recibidos:", result);

      return result;
    } catch (error) {
      console.error("🚨 Error en getParametrosAmortizacion:", error);
      return handleNetworkError(error);
    }
  }

  /**
   * Obtiene parámetros de amortización de un reporte guardado
   * Devuelve los valores exactos que se usaron en ese análisis
   */
  async getParametrosAmortizacionReporte(
    flujoHistorialId: number
  ): Promise<ApiResponse<any>> {
    try {
      console.log(
        "🌐 Obteniendo parámetros de amortización de reporte:",
        flujoHistorialId
      );

      const response = await fetch(
        `${ENDPOINT}/amortizacion/reporte/${flujoHistorialId}`
      );

      const result = await handleApiResponse<any>(response);
      console.log(
        "📊 Parámetros de amortización del reporte recibidos:",
        result
      );

      return result;
    } catch (error) {
      console.error("🚨 Error en getParametrosAmortizacionReporte:", error);
      return handleNetworkError(error);
    }
  }
}

export const flujoCajaService = new FlujoCajaService();
export { FlujoCajaService };
