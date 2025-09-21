import { RatioVersion } from "../models/types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreateRatioDto {
  modelo_id: number;
  tipo_ratio_id: number;
  valor?: number | null;
  fecha_efectiva: string; // ISO
  comentario?: string;
}
interface UpdateRatioDto {
  modelo_id?: number;
  tipo_ratio_id?: number;
  valor?: number | null;
  fecha_efectiva?: string;
  comentario?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const RATIOS_ENDPOINT = `${API_BASE_URL}/ratios-historico`;

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

class RatiosService {
  async create(dto: CreateRatioDto): Promise<ApiResponse<RatioVersion>> {
    try {
      const resp = await fetch(RATIOS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      return await handleApiResponse<RatioVersion>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async listByModelo(modeloId: number): Promise<ApiResponse<RatioVersion[]>> {
    try {
      const resp = await fetch(`${RATIOS_ENDPOINT}/by-modelo/${modeloId}`);
      return await handleApiResponse<RatioVersion[]>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async listByTipo(tipoId: number): Promise<ApiResponse<RatioVersion[]>> {
    try {
      const resp = await fetch(`${RATIOS_ENDPOINT}/by-tipo-ratio/${tipoId}`);
      return await handleApiResponse<RatioVersion[]>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async listByFecha(
    desde: string,
    hasta: string
  ): Promise<ApiResponse<RatioVersion[]>> {
    try {
      const params = new URLSearchParams({
        fechaDesde: desde,
        fechaHasta: hasta,
      }).toString();
      const resp = await fetch(`${RATIOS_ENDPOINT}/by-fecha-range?${params}`);
      return await handleApiResponse<RatioVersion[]>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async latestByModelo(modeloId: number): Promise<ApiResponse<RatioVersion[]>> {
    try {
      const resp = await fetch(
        `${RATIOS_ENDPOINT}/latest-by-modelo/${modeloId}`
      );
      return await handleApiResponse<RatioVersion[]>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async update(
    id: number,
    dto: UpdateRatioDto
  ): Promise<ApiResponse<RatioVersion>> {
    try {
      const resp = await fetch(`${RATIOS_ENDPOINT}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      return await handleApiResponse<RatioVersion>(resp);
    } catch (e) {
      return netErr(e);
    }
  }
}

export const ratiosService = new RatiosService();
export type { CreateRatioDto, UpdateRatioDto, ApiResponse };
