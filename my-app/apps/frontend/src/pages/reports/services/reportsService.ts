import { ApiResponse, MachineReportData, ReportsStats } from "../models/types";
import { getAuthHeaders } from "@/utils/authUtils";

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

class ReportsService {
  /**
   * Obtiene todas las máquinas con sus reportes de resumen más recientes
   */
  async getAllMachinesReports(): Promise<ApiResponse<MachineReportData[]>> {
    try {
      console.log(
        "🌐 Obteniendo reportes de máquinas desde:",
        `${ENDPOINT}/machines/resumen-reports`
      );

      const response = await fetch(`${ENDPOINT}/machines/resumen-reports`, {
        headers: getAuthHeaders(),
      });

      console.log("📡 Response status:", response.status);
      const result = await handleApiResponse<MachineReportData[]>(response);
      console.log("📊 Datos recibidos:", result.data?.length || 0, "máquinas");

      return result;
    } catch (error) {
      console.error("🚨 Error en getAllMachinesReports:", error);
      return handleNetworkError(error);
    }
  }

  /**
   * Obtiene estadísticas generales de los reportes
   */
  async getReportsStats(): Promise<ApiResponse<ReportsStats>> {
    try {
      const reportsResponse = await this.getAllMachinesReports();

      if (!reportsResponse.success || !reportsResponse.data) {
        return {
          success: false,
          error:
            "No se pudieron obtener los datos para calcular las estadísticas",
        };
      }

      const machinesData = reportsResponse.data;

      // Calcular estadísticas
      const totalMachines = machinesData.length;
      const totalReports = machinesData.reduce(
        (sum, machine) => sum + machine.totalReports,
        0
      );

      // Calcular costo promedio por hora (usando el primer escenario de cada máquina)
      const costsPerHour = machinesData
        .filter((machine) => machine.resumen && machine.resumen.length > 0)
        .map((machine) => machine.resumen[0]["Costo_Hr"]);

      const avgCostPerHour =
        costsPerHour.length > 0
          ? costsPerHour.reduce((sum, cost) => sum + cost, 0) /
            costsPerHour.length
          : 0;

      // Fecha de la última actualización
      const lastUpdateDates = machinesData
        .map((machine) => machine.latestReport?.fechaCalculo)
        .filter((date) => date)
        .sort()
        .reverse();

      const lastUpdateDate = lastUpdateDates[0] || new Date().toISOString();

      const stats: ReportsStats = {
        totalMachines,
        totalReports,
        avgCostPerHour,
        lastUpdateDate,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("🚨 Error en getReportsStats:", error);
      return handleNetworkError(error);
    }
  }

  /**
   * Obtiene información básica de máquinas sin resumen (más rápido)
   */
  async getAllMachinesBasicReports(): Promise<ApiResponse<any[]>> {
    try {
      console.log(
        "🌐 Obteniendo información básica de máquinas desde:",
        `${ENDPOINT}/machines/latest-reports`
      );

      const response = await fetch(`${ENDPOINT}/machines/latest-reports`, {
        headers: getAuthHeaders(),
      });

      console.log("📡 Response status:", response.status);
      const result = await handleApiResponse<any[]>(response);
      console.log(
        "📊 Datos básicos recibidos:",
        result.data?.length || 0,
        "máquinas"
      );

      return result;
    } catch (error) {
      console.error("🚨 Error en getAllMachinesBasicReports:", error);
      return handleNetworkError(error);
    }
  }
}

export const reportsService = new ReportsService();
export { ReportsService };
