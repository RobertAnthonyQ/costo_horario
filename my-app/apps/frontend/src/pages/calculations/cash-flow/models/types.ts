// Tipos para Análisis de Flujo de Caja

export interface FlujoCajaInput {
  machineId: number;
  porcentajeResidual?: number; // % del valor residual (ej: 0.1 = 10%)
  margenInterno?: number; // % margen interno (ej: 0.05 = 5%)
  gastosGeneralesMantenimiento?: number; // % gastos generales (ej: 0.05 = 5%)
  horasOperativasMes?: number; // Horas operativas por mes
  tasaDescuentoEmpresa?: number; // Tasa de descuento (ej: 0.08 = 8%)
  comentario?: string;
  usuarioId?: string;
}

export interface EscenarioHoras {
  horasMinimas: number;
  gradoOperatividad: number;
  factorMercado: number;
  horasUsoAnual: number;
  seguroTrec: number;
}

export interface DatosPrecargadosInforme {
  valorAdquisicion: number;
  vidaUtilFabricante: number;
  mesesAlAnio: number;
  escenariosHoras: EscenarioHoras[];
  totalPosesionMantenimiento: number;
  mantenimiento: {
    preventivo: number;
    correctivo: number;
    neumaticos: number;
    elementosDesgaste: number;
    soldadura: number;
    manoDeObraSupervision: number;
  };
  primaSeguroTrec: number;
  informeOrigen: {
    id: number;
    fechaCalculo: string;
    tasaFinanciamiento: number;
    aniosFinanciamiento: number;
    tasaSeguro: number;
    porcentajeUtilidad: number;
  };
}

export interface FlujoCajaParametros {
  porcentajeResidual: number;
  margenInterno: number;
  gastosGeneralesMantenimiento: number;
  horasOperativasMes: number;
  tasaDescuentoEmpresa: number;
  usuarioId?: string;
  fechaCalculo: string;
  comentario?: string;
}

export interface FlujoCajaResponse {
  analisisId?: number;
  machine: {
    id: number;
    item: number;
    equipo: string | null;
    marca: string | null;
    modelo: string | null;
    estado: string | null;
    idEquipo: number | null;
  };
  datosPrecargados: DatosPrecargadosInforme;
  parametros: FlujoCajaParametros;
  estado: "precargado" | "calculado" | "guardado";
  resultadoFlujo?: any;
  otrosDatos?: any;
}

export interface FlujoCajaVersion {
  id: number;
  nombre: string;
  fechaCalculo: string;
  machine: {
    id: number;
    marca: string;
    modelo: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
