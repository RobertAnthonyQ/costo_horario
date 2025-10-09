import { ApiResponse, PICRecord, RawPICRecord } from "../models/types";
import { fetchWithAuth } from "@/utils/authUtils";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const ENDPOINT = `${API_BASE_URL}/modelo-componentes-historico`;

// Helpers de normalización
function toNum(value: unknown, fallback: number | null = null): number | null {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number") return isNaN(value) ? fallback : value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    const n = Number(trimmed);
    return isNaN(n) ? fallback : n;
  }
  return fallback;
}

function normalizePICRecord(raw: RawPICRecord): PICRecord {
  return {
    ...raw,
    pcr: toNum(raw.pcr),
    monto_usd: toNum(raw.monto_usd),
    distribucion: toNum(raw.distribucion, 0) ?? 0,
    monto_aplicado_al_proyecto: toNum(raw.monto_aplicado_al_proyecto, 0) ?? 0,
  };
}

async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  try {
    const text = await response.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch (err) {
      console.warn("⚠️ No se pudo parsear JSON, se devuelve texto crudo");
      parsed = text;
    }

    if (!response.ok) {
      console.error("❌ Error API PICs", {
        status: response.status,
        statusText: response.statusText,
        body: parsed,
      });
      return {
        success: false,
        error:
          (parsed && (parsed.message || parsed.error)) ||
          (typeof parsed === "string" ? parsed : response.statusText),
      };
    }

    let normalized: any = parsed;
    if (Array.isArray(parsed)) {
      // Normalizamos arrays de registros PIC
      normalized = parsed.map((r: RawPICRecord) => normalizePICRecord(r));
    } else if (parsed && typeof parsed === "object") {
      // Si se trata de un registro PIC individual (tiene campos clave), normalizar;
      // de lo contrario, devolver tal cual para no romper respuestas de resumen.
      const looksLikePICRecord =
        Object.prototype.hasOwnProperty.call(parsed, "id") &&
        Object.prototype.hasOwnProperty.call(parsed, "modelo_id") &&
        Object.prototype.hasOwnProperty.call(parsed, "componente_id");
      normalized = looksLikePICRecord
        ? normalizePICRecord(parsed as RawPICRecord)
        : parsed;
    }

    console.log("✅ Respuesta PICs exitosa", {
      count: Array.isArray(normalized) ? normalized.length : undefined,
    });
    return { success: true, data: normalized as T };
  } catch (e) {
    console.error("❌ Excepción procesando respuesta PICs", e);
    return {
      success: false,
      error: "Error al procesar la respuesta del servidor",
    };
  }
}

function netErr(e: any): ApiResponse<any> {
  return { success: false, error: "Error de conexión. Verifique su red." };
}

// Handler especializado para endpoints que devuelven listas de PICs
async function handlePICArrayResponse(
  response: Response
): Promise<ApiResponse<PICRecord[]>> {
  try {
    const text = await response.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch (err) {
      console.warn("⚠️ No se pudo parsear JSON, se devuelve texto crudo");
      parsed = text;
    }

    if (!response.ok) {
      console.error("❌ Error API PICs (array)", {
        status: response.status,
        statusText: response.statusText,
        body: parsed,
      });
      return {
        success: false,
        error:
          (parsed && (parsed.message || parsed.error)) ||
          (typeof parsed === "string" ? parsed : response.statusText),
      };
    }

    // Algunas APIs devuelven { data: [...] }
    let payload: any = parsed;
    if (payload && typeof payload === "object" && Array.isArray(payload.data)) {
      payload = payload.data;
    }

    const normalized: PICRecord[] = Array.isArray(payload)
      ? payload.map((r: RawPICRecord) => normalizePICRecord(r))
      : [];

    console.log("✅ Respuesta PICs (array) exitosa", {
      count: normalized.length,
    });
    return { success: true, data: normalized };
  } catch (e) {
    console.error("❌ Excepción procesando respuesta PICs (array)", e);
    return {
      success: false,
      error: "Error al procesar la respuesta del servidor",
    };
  }
}

// Handler genérico para objetos JSON (sin normalizar a PICRecord)
async function handleJsonObjectResponse<T = any>(
  response: Response
): Promise<ApiResponse<T>> {
  try {
    const text = await response.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch (err) {
      console.warn("⚠️ No se pudo parsear JSON, se devuelve texto crudo");
      parsed = text;
    }

    if (!response.ok) {
      console.error("❌ Error API JSON (obj)", {
        status: response.status,
        statusText: response.statusText,
        body: parsed,
      });
      return {
        success: false,
        error:
          (parsed && (parsed.message || parsed.error)) ||
          (typeof parsed === "string" ? parsed : response.statusText),
      };
    }

    // Si viene envuelto en { data: {...} }, desempaquetar.
    const payload =
      parsed && typeof parsed === "object" && "data" in parsed
        ? parsed.data
        : parsed;
    return { success: true, data: payload as T };
  } catch (e) {
    console.error("❌ Excepción procesando respuesta JSON (obj)", e);
    return {
      success: false,
      error: "Error al procesar la respuesta del servidor",
    };
  }
}

class PICsService {
  async listAll(): Promise<ApiResponse<PICRecord[]>> {
    try {
      console.log("📡 GET PICs listAll ->", ENDPOINT);
      const resp = await fetchWithAuth(ENDPOINT);
      return await handlePICArrayResponse(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async latestByModelo(modeloId: number): Promise<ApiResponse<PICRecord[]>> {
    try {
      const url = `${ENDPOINT}/latest-by-modelo/${modeloId}`;
      console.log("📡 GET PICs latestByModelo ->", url);
      const resp = await fetchWithAuth(url);
      return await handlePICArrayResponse(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async byModelo(modeloId: number): Promise<ApiResponse<PICRecord[]>> {
    try {
      const url = `${ENDPOINT}/by-modelo/${modeloId}`;
      console.log("📡 GET PICs byModelo ->", url);
      const resp = await fetchWithAuth(url);
      return await handlePICArrayResponse(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async byComponente(componenteId: number): Promise<ApiResponse<PICRecord[]>> {
    try {
      const url = `${ENDPOINT}/by-componente/${componenteId}`;
      console.log("📡 GET PICs byComponente ->", url);
      const resp = await fetchWithAuth(url);
      return await handlePICArrayResponse(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async byFechaRange(
    desde: string,
    hasta: string
  ): Promise<ApiResponse<PICRecord[]>> {
    try {
      const params = new URLSearchParams({
        fechaDesde: desde,
        fechaHasta: hasta,
      }).toString();
      const url = `${ENDPOINT}/by-fecha-range?${params}`;
      console.log("📡 GET PICs byFechaRange ->", url);
      const resp = await fetchWithAuth(url);
      return await handlePICArrayResponse(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async createRecord(input: {
    modelo_id: number;
    componente_id: number;
    pcr?: number | null;
    monto_usd?: number | null;
    fecha_efectiva?: string; // opcional, backend calculará distribucion/monto_aplicado
  }): Promise<ApiResponse<PICRecord>> {
    try {
      const body = {
        modelo_id: input.modelo_id,
        componente_id: input.componente_id,
        pcr: input.pcr ?? null,
        monto_usd: input.monto_usd ?? null,
        fecha_efectiva: input.fecha_efectiva || new Date().toISOString(),
      };
      console.log("🆕 POST PICs createRecord ->", body);
      const resp = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return await handleApiResponse<PICRecord>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async updateRecord(
    id: number,
    changes: { pcr?: number | null; monto_usd?: number | null }
  ): Promise<ApiResponse<PICRecord>> {
    try {
      const body: Record<string, any> = {};
      if (changes.pcr !== undefined) body.pcr = changes.pcr;
      if (changes.monto_usd !== undefined) body.monto_usd = changes.monto_usd;
      if (Object.keys(body).length === 0) {
        return { success: false, error: "Sin cambios" };
      }
      console.log("✏️ PATCH PICs updateRecord ->", id, body);
      const resp = await fetch(`${ENDPOINT}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return await handleApiResponse<PICRecord>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async getTotalResumenByModelo(modeloId: number): Promise<ApiResponse<any>> {
    try {
      const url = `${ENDPOINT}/total-resumen-by-modelo/${modeloId}`;
      console.log("📊 GET PICs getTotalResumenByModelo ->", url);
      const resp = await fetchWithAuth(url);
      return await handleJsonObjectResponse<any>(resp);
    } catch (e) {
      return netErr(e);
    }
  }

  async getResumenPorComponente(modeloId?: number): Promise<ApiResponse<any>> {
    try {
      const params = modeloId ? `?modeloId=${modeloId}` : "";
      const url = `${ENDPOINT}/resumen-por-componente${params}`;
      console.log("📊 GET PICs getResumenPorComponente ->", url);
      const resp = await fetchWithAuth(url);
      return await handleJsonObjectResponse<any>(resp);
    } catch (e) {
      return netErr(e);
    }
  }
}

export const picsService = new PICsService();
export { PICsService };
