// Tipos para Informe de Costo Horario

export interface HourlyCostInput {
  machineId: number;
  posesionId?: number;
  mesesPorAnio: number;
  tasaFinanciamiento: number;
  aniosFinanciamiento: number;
  tasaSeguro: number;
  aniosSeguro: number;
  comentario?: string;
  usuarioId?: string;
  incluyeGastosDistribuibles?: boolean;
  costoMCorrMayores?: number;
}

export interface HourlyCostScenario {
  totales: {
    total: number; // horas mínimas del escenario
    fijosMasVariables: number; // costo horario total US$/hr
  };
  seccion1: {
    operacion: {
      horasMinimas: number;
      horasUsoAnual: number;
      politicaDepreciacionAnos: number;
    };
    descripcion: Record<string, any>;
  };
  seccion2: {
    descripcion: Record<string, any>;
    ratiosUsdHr: Record<string, number>;
  };
  seccion3: {
    posesion: {
      subtotal: number;
      depreciacion: number;
      financiamiento: number;
      seguroTrec: number;
      subtotalFijos: number;
      totalCostoFijo: number;
      gastoDistribuibles: number;
      utilidad: number;
    };
  };
  seccion4: {
    utilidad: number;
    neumaticos: number;
    estructural: number;
    elementosDesgaste: number;
    mantenimientoCorrectivo: number;
    mantenimientoPreventivo: number;
    subtotalVariable: number;
    totalCostoVariable: number;
  };
  horasMinimas: number;
  factorMercado: number;
  horasUsoAnual: number;
  gradoOperatividad: number;
}

export interface HourlyCostReportResponse {
  id: number;
  machine_id: number;
  usuario_id?: string | null;
  resultado_completo_json: {
    machine: Record<string, any>;
    version: string;
    comentario?: string;
    escenarios: HourlyCostScenario[];
    parametros: Record<string, any>;
    ratiosMeta: Array<Record<string, any>>;
    componentesMeta: Array<Record<string, any>>;
  };
  escenarios_horas: {
    escenarios: Array<{
      horasMinimas: number;
      factorMercado: number;
      gradoOperatividad: number;
    }>;
  };
  tasa_financiamiento_usada: number;
  anios_financiamiento: number;
  tasa_seguro_usada: number;
  anios_seguro: number;
  mes_por_anio: number;
  fecha_calculo: string;
  machine: {
    id: number;
    id_equipo_interno?: string;
    modelo?: { nombre?: string; marca?: { nombre?: string } };
    vida_util?: number;
    valor_similar_nuevo?: number | string;
    link_imagen?: string | null;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
