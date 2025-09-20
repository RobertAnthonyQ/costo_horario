import { PossessionVersion, ScenarioCalculationResult } from "../models/types";

// Interfaces para las respuestas del backend
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreateCalculationDto {
  machine_id: number;
  horas_json: {
    escenarios: {
      horasMinimas: number;
      gradoDeOperatividad: number;
      factorDeMercado: number;
    }[];
  };
  comentario?: string;
  usuario_id?: string;
}

interface PossessionHistoryResponse {
  id: number;
  machine_id: number;
  fecha_calculo: string;
  comentario?: string;
  usuario_id?: string;
  horas_json: {
    escenarios: {
      horasMinimas: number;
      gradoDeOperatividad: number;
      factorDeMercado: number;
    }[];
  };
  resultados_json: {
    escenarios: ScenarioCalculationResult[];
    machine_id: number;
    fecha_calculo: string;
    inputs: CreateCalculationDto;
  };
  machine_info?: {
    id: number;
    id_equipo_interno?: string;
    modelo: any;
  };
}

interface PossessionSummaryResponse {
  id: number;
  machine_id: number;
  fecha_calculo: string;
  comentario?: string;
  usuario_id?: string;
  numero_escenarios: number;
}

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const POSSESSION_ENDPOINT = `${API_BASE_URL}/calculos/posesion`;

// Función auxiliar para manejar respuestas de la API
async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  console.log("🔍 Procesando respuesta de la API de posesión...");

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

class PossessionService {
  // Calcular y guardar posesión
  async calculateAndSavePossession(
    data: CreateCalculationDto
  ): Promise<ApiResponse<PossessionHistoryResponse>> {
    console.log("🚀 PossessionService: Iniciando calculateAndSavePossession()");
    console.log("🔗 URL de la API:", POSSESSION_ENDPOINT);
    console.log("📊 Datos a enviar:", data);

    try {
      const response = await fetch(POSSESSION_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("📥 Respuesta recibida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
      });

      return await handleApiResponse<PossessionHistoryResponse>(response);
    } catch (error) {
      console.error("❌ Error en calculateAndSavePossession:", error);
      return handleNetworkError(error);
    }
  }

  // Vista previa del cálculo (sin guardar)
  async calculatePossessionPreview(
    data: CreateCalculationDto
  ): Promise<ApiResponse<any>> {
    console.log("🚀 PossessionService: Iniciando calculatePossessionPreview()");
    console.log("🔗 URL de la API:", `${POSSESSION_ENDPOINT}/preview`);

    try {
      const response = await fetch(`${POSSESSION_ENDPOINT}/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("📥 Respuesta recibida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      return await handleApiResponse<any>(response);
    } catch (error) {
      console.error("❌ Error en calculatePossessionPreview:", error);
      return handleNetworkError(error);
    }
  }

  // Obtener resumen del historial de posesión por máquina
  async getPossessionSummaryByMachine(
    machineId: number
  ): Promise<ApiResponse<PossessionSummaryResponse[]>> {
    console.log(
      "🚀 PossessionService: Iniciando getPossessionSummaryByMachine()"
    );
    console.log(
      "🔗 URL de la API:",
      `${POSSESSION_ENDPOINT}/machine/${machineId}/summary`
    );
    console.log("🏭 Machine ID:", machineId);

    try {
      const response = await fetch(
        `${POSSESSION_ENDPOINT}/machine/${machineId}/summary`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 Respuesta recibida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      return await handleApiResponse<PossessionSummaryResponse[]>(response);
    } catch (error) {
      console.error("❌ Error en getPossessionSummaryByMachine:", error);
      return handleNetworkError(error);
    }
  }

  // Obtener historial completo de posesión por máquina
  async getPossessionHistoryByMachine(
    machineId: number
  ): Promise<ApiResponse<PossessionHistoryResponse[]>> {
    console.log(
      "🚀 PossessionService: Iniciando getPossessionHistoryByMachine()"
    );
    console.log(
      "🔗 URL de la API:",
      `${POSSESSION_ENDPOINT}/machine/${machineId}`
    );

    try {
      const response = await fetch(
        `${POSSESSION_ENDPOINT}/machine/${machineId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 Respuesta recibida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      return await handleApiResponse<PossessionHistoryResponse[]>(response);
    } catch (error) {
      console.error("❌ Error en getPossessionHistoryByMachine:", error);
      return handleNetworkError(error);
    }
  }

  // Obtener registro específico del historial
  async getPossessionHistoryById(
    id: number
  ): Promise<ApiResponse<PossessionHistoryResponse>> {
    console.log("🚀 PossessionService: Iniciando getPossessionHistoryById()");
    console.log("🔗 URL de la API:", `${POSSESSION_ENDPOINT}/${id}`);
    console.log("🆔 History ID:", id);

    try {
      const response = await fetch(`${POSSESSION_ENDPOINT}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📥 Respuesta recibida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      return await handleApiResponse<PossessionHistoryResponse>(response);
    } catch (error) {
      console.error("❌ Error en getPossessionHistoryById:", error);
      return handleNetworkError(error);
    }
  }
}

// Exportar una instancia singleton del servicio
export const possessionService = new PossessionService();

// También exportar la clase para testing o casos especiales
export { PossessionService };

// Exportar tipos para uso en componentes
export type {
  CreateCalculationDto,
  PossessionHistoryResponse,
  PossessionSummaryResponse,
  ApiResponse,
};
