import type { ApiResponse } from "../../reports/models/types";
import { getAuthHeaders } from "@/utils/authUtils";

// Tipos alineados al backend
export interface DatosAdicionalesMaquina {
  procedencia_pais?: string;
  potencia_nominal_hp?: string;
  consumo_combustible_lh?: number;
  equipos_comercializados_peru?: number;
  plazo_entrega_dias?: number;
  capacitacion_horas?: number;
  tiempo_atencion_repuestos_dias?: string;
  ofrece_financiamiento?: boolean;
}

export interface DatosMaquinaComparativa {
  machineId: number;
  versionFlujoCajaId: number;

  marca: string;
  modelo: string;
  equipo?: string;
  estado?: string;
  idEquipo?: number;

  vidaUtil: number;
  valorAdquisicion: number;
  valorResidual: number;

  datosAdicionales?: DatosAdicionalesMaquina;

  tarifaHorariaInterna: number;
  tarifaHorariaInternaEquivalente: number;
  margenInternoEquivalente: number;
  valorPresenteNeto: number;
  anualidadEquivalenteVAN: number;
  valorPresenteNetoPorVidaUtil: number;
  valorPresenteNetoPorDolarInvertido: number;
  tasaInternaRetorno: number;
  beneficioCosto: number;
  retornoInversion: number;
  periodoRecuperacion: number;

  fechaAnalisisFlujoCaja: string | Date;
  comentarioFlujoCaja?: string;
}

export interface ResumenEstadistico {
  vanPromedio: number;
  vanMaximo: number;
  vanMinimo: number;
  vanDesviacionEstandar: number;
  tirPromedio: number;
  tirMaximo: number;
  tirMinimo: number;
  tirDesviacionEstandar: number;
  tarifaPromedio: number;
  tarifaMaxima: number;
  tarifaMinima: number;
  tarifaDesviacionEstandar: number;
  beneficioCostoPromedio: number;
  beneficioCostoMaximo: number;
  beneficioCostoMinimo: number;
  periodoRecuperacionPromedio: number;
  periodoRecuperacionMaximo: number;
  periodoRecuperacionMinimo: number;
  totalMaquinas: number;
  maquinasConVANPositivo: number;
  maquinasConTIRSuperiorTasaDescuento: number;
}

export interface MaquinaAnalisisDto {
  machineId: number;
  versionId: number;
}

export interface CreateAnalisisConclusionDto {
  maquinas: MaquinaAnalisisDto[];
  lugarTrabajo: string;
  comentario?: string;
  usuarioId?: string;
}

export interface ConclusionResponse {
  parametros: {
    lugarTrabajo: string;
    fechaAnalisis: string;
    comentario?: string;
    usuarioId?: string;
    totalMaquinasAnalizadas: number;
  };
  maquinas: DatosMaquinaComparativa[];
  resumen: ResumenEstadistico;
  recomendaciones: {
    mejorVAN: DatosMaquinaComparativa;
    mejorTIR: DatosMaquinaComparativa;
    mejorBeneficioCosto: DatosMaquinaComparativa;
    menorPeriodoRecuperacion: DatosMaquinaComparativa;
    tarifaMasCompetitiva: DatosMaquinaComparativa;
    resumenEjecutivo: string;
    advertencias?: string[];
  };
  otrosDatos?: {
    recomendacionTexto?: string;
    conclusionTexto?: string;
    iaFuente?: string;
  };
  estado: "calculado" | "guardado";
  analisisId?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const ENDPOINT = `${API_BASE_URL}/calculos/conclusion`;

async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();
    if (!response.ok)
      return {
        success: false,
        error: data?.message || `Error ${response.status}`,
      };
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: "Error al procesar la respuesta del servidor",
    };
  }
}

export class ConclusionService {
  async analizar(
    payload: CreateAnalisisConclusionDto
  ): Promise<ApiResponse<ConclusionResponse>> {
    const res = await fetch(`${ENDPOINT}/analizar`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleApiResponse<ConclusionResponse>(res);
  }

  async calcularYGuardar(
    payload: CreateAnalisisConclusionDto
  ): Promise<ApiResponse<any>> {
    const res = await fetch(`${ENDPOINT}/calcular-y-guardar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<any>(res);
  }

  async getTodos(): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${ENDPOINT}/todos`, {
      headers: getAuthHeaders(),
    });
    return handleApiResponse<any[]>(res);
  }

  async getById(id: number): Promise<ApiResponse<ConclusionResponse>> {
    const res = await fetch(`${ENDPOINT}/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleApiResponse<ConclusionResponse>(res);
  }

  async guardar(data: ConclusionResponse): Promise<ApiResponse<any>> {
    const res = await fetch(`${ENDPOINT}/guardar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleApiResponse<any>(res);
  }
}

export const conclusionService = new ConclusionService();
