import {
  ApiResponse,
  HourlyCostInput,
  HourlyCostReportResponse,
  PosesionVersion,
} from "../models/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const ENDPOINT = `${API_BASE_URL}/calculos/informe-costo-horario`;

async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data?.message || `Error ${response.status}`,
      };
    }
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: "Error al procesar la respuesta del servidor",
    };
  }
}

function handleNetworkError(error: any): ApiResponse<any> {
  console.error("Network error:", error);
  return { success: false, error: "Error de conexión. Verifica tu internet." };
}

class HourlyCostService {
  async createReport(
    input: HourlyCostInput
  ): Promise<ApiResponse<HourlyCostReportResponse>> {
    try {
      console.log("🌐 Enviando petición create a:", ENDPOINT);
      console.log("📋 Input enviado:", JSON.stringify(input, null, 2));

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      console.log("📡 Response status:", response.status);
      const result =
        await handleApiResponse<HourlyCostReportResponse>(response);
      console.log("📊 Result recibido:", result);

      return result;
    } catch (error) {
      console.error("🚨 Error en createReport:", error);
      return handleNetworkError(error);
    }
  }

  async previewReport(
    input: HourlyCostInput
  ): Promise<ApiResponse<HourlyCostReportResponse>> {
    try {
      console.log("🌐 Enviando petición preview a:", `${ENDPOINT}/preview`);
      console.log("📋 Input enviado:", JSON.stringify(input, null, 2));

      const response = await fetch(`${ENDPOINT}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      console.log("📡 Response status:", response.status);
      const result =
        await handleApiResponse<HourlyCostReportResponse>(response);
      console.log("📊 Result recibido:", result);

      return result;
    } catch (error) {
      console.error("🚨 Error en previewReport:", error);
      return handleNetworkError(error);
    }
  }

  async getReportById(
    id: number
  ): Promise<ApiResponse<HourlyCostReportResponse>> {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`);
      return await handleApiResponse<HourlyCostReportResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  async getHistoryByMachine(
    machineId: number
  ): Promise<ApiResponse<HourlyCostReportResponse[]>> {
    try {
      const response = await fetch(`${ENDPOINT}/machine/${machineId}`);
      return await handleApiResponse<HourlyCostReportResponse[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }

  async getVersionsByMachine(
    machineId: number
  ): Promise<ApiResponse<PosesionVersion[]>> {
    try {
      const POSESION_ENDPOINT = `${API_BASE_URL}/calculos/posesion`;
      const response = await fetch(
        `${POSESION_ENDPOINT}/machine/${machineId}/summary`
      );
      return await handleApiResponse<PosesionVersion[]>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  }
}

export const hourlyCostService = new HourlyCostService();
export { HourlyCostService };
