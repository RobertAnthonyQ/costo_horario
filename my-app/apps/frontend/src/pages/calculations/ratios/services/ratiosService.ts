import { RatioVersion } from "../models/types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RatiosVersionJson {
  fecha_efectiva: string;
  ratios: Array<{
    tipo_ratio_id: number;
    tipo_ratio_nombre: string;
    valor: number | null;
    categoria: string;
  }>;
  comentario?: string;
  usuario_id?: string;
}

interface CreateRatioDto {
  modelo_id: number;
  tipo_ratio_id: number;
  valor?: number | null;
  fecha_efectiva: string; // ISO
  comentario?: string;
  ratios_version?: RatiosVersionJson;
  lugar_operacion?: string;
}
interface UpdateRatioDto {
  modelo_id?: number;
  tipo_ratio_id?: number;
  valor?: number | null;
  fecha_efectiva?: string;
  comentario?: string;
  ratios_version?: RatiosVersionJson;
  lugar_operacion?: string;
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

  // Nuevos métodos para versiones JSON
  async getAllVersionesJson(lugar?: string): Promise<ApiResponse<any[]>> {
    try {
      const params = lugar ? `?lugar=${encodeURIComponent(lugar)}` : "";
      const resp = await fetch(`${RATIOS_ENDPOINT}/versiones-json${params}`);
      return await handleApiResponse<any[]>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async getVersionesByModelo(modeloId: number): Promise<ApiResponse<any[]>> {
    try {
      const resp = await fetch(
        `${RATIOS_ENDPOINT}/versiones-by-modelo/${modeloId}`
      );
      return await handleApiResponse<any[]>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async getVersionesByTipoRatio(
    tipoRatioId: number
  ): Promise<ApiResponse<any[]>> {
    try {
      const resp = await fetch(
        `${RATIOS_ENDPOINT}/versiones-by-tipo-ratio/${tipoRatioId}`
      );
      return await handleApiResponse<any[]>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async createCompleteVersion(
    modeloId: number,
    data: {
      comentario?: string;
      usuario_id?: string;
      lugar_operacion?: string;
    }
  ): Promise<ApiResponse<RatioVersion>> {
    try {
      const resp = await fetch(
        `${RATIOS_ENDPOINT}/create-complete-version/${modeloId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      return await handleApiResponse<RatioVersion>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async listByLugarOperacion(
    lugar: string
  ): Promise<ApiResponse<RatioVersion[]>> {
    try {
      const params = new URLSearchParams({ lugar }).toString();
      const resp = await fetch(
        `${RATIOS_ENDPOINT}/by-lugar-operacion?${params}`
      );
      return await handleApiResponse<RatioVersion[]>(resp);
    } catch (e) {
      return netErr(e);
    }
  }
}

export const ratiosService = new RatiosService();
export type { CreateRatioDto, UpdateRatioDto, ApiResponse, RatiosVersionJson };
