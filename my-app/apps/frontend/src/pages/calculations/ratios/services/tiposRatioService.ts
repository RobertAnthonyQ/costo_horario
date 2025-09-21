import { RatioType } from "../models/types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TIPOS_RATIO_ENDPOINT = `${API_BASE_URL}/tipos-ratio`;

async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: (data && (data.message || data.error)) || response.statusText,
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

function netErr(e: any): ApiResponse<any> {
  return { success: false, error: "Error de conexión. Verifique su red." };
}

class TiposRatioService {
  async listAll(): Promise<ApiResponse<RatioType[]>> {
    try {
      const resp = await fetch(TIPOS_RATIO_ENDPOINT);
      return await handleApiResponse<RatioType[]>(resp);
    } catch (e) {
      return netErr(e);
    }
  }
}

export const tiposRatioService = new TiposRatioService();
export type { ApiResponse };
