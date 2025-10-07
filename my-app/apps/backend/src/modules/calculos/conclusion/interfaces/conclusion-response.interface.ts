// Interfaz para datos adicionales de la máquina (otros_json)
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

// Interfaz para los datos básicos de cada máquina en el análisis
export interface DatosMaquinaComparativa {
  // Identificación de la máquina
  machineId: number;
  versionFlujoCajaId: number;

  // Datos básicos de la máquina
  marca: string;
  modelo: string;
  equipo?: string;
  estado?: string;
  idEquipo?: number;

  // Vida útil y valores básicos
  vidaUtil: number; // en horas
  valorAdquisicion: number;
  valorResidual: number;

  // Datos adicionales de la máquina
  datosAdicionales?: DatosAdicionalesMaquina;

  // Datos extraídos del flujo de caja
  tarifaHorariaInterna: number; // $/h
  tarifaHorariaInternaEquivalente: number; // $/h
  margenInternoEquivalente: number; // % - Margen interno que hace VAN = 0
  valorPresenteNeto: number; // $
  anualidadEquivalenteVAN: number; // $/año
  valorPresenteNetoPorVidaUtil: number; // $/h
  valorPresenteNetoPorDolarInvertido: number; // adimensional
  tasaInternaRetorno: number; // %
  beneficioCosto: number; // adimensional
  retornoInversion: number; // %
  periodoRecuperacion: number; // años

  // Metadatos del análisis
  fechaAnalisisFlujoCaja: Date;
  comentarioFlujoCaja?: string;
}

// Interfaz para el resumen estadístico del análisis comparativo
export interface ResumenEstadistico {
  // Estadísticas de Valor Presente Neto
  vanPromedio: number;
  vanMaximo: number;
  vanMinimo: number;
  vanDesviacionEstandar: number;

  // Estadísticas de TIR
  tirPromedio: number;
  tirMaximo: number;
  tirMinimo: number;
  tirDesviacionEstandar: number;

  // Estadísticas de Tarifa Horaria
  tarifaPromedio: number;
  tarifaMaxima: number;
  tarifaMinima: number;
  tarifaDesviacionEstandar: number;

  // Estadísticas de Beneficio/Costo
  beneficioCostoPromedio: number;
  beneficioCostoMaximo: number;
  beneficioCostoMinimo: number;

  // Estadísticas de Período de Recuperación
  periodoRecuperacionPromedio: number;
  periodoRecuperacionMaximo: number;
  periodoRecuperacionMinimo: number;

  // Contadores
  totalMaquinas: number;
  maquinasConVANPositivo: number;
  maquinasConTIRSuperiorTasaDescuento: number;
}

// Interfaz principal de respuesta para análisis de conclusión
export interface ConclusionResponse {
  // Identificación del análisis
  analisisId?: number;

  // Parámetros del análisis
  parametros: {
    lugarTrabajo: string;
    fechaAnalisis: string;
    comentario?: string;
    usuarioId?: string;
    totalMaquinasAnalizadas: number;
  };

  // Datos detallados de cada máquina
  maquinas: DatosMaquinaComparativa[];

  // Resumen estadístico
  resumen: ResumenEstadistico;

  // Recomendaciones automáticas
  recomendaciones: {
    mejorVAN: DatosMaquinaComparativa;
    mejorTIR: DatosMaquinaComparativa;
    mejorBeneficioCosto: DatosMaquinaComparativa;
    menorPeriodoRecuperacion: DatosMaquinaComparativa;
    tarifaMasCompetitiva: DatosMaquinaComparativa;

    // Texto de recomendaciones
    resumenEjecutivo: string;
    advertencias?: string[];
  };

  // Estado del análisis
  estado: 'calculado' | 'guardado';

  // Datos adicionales flexibles
  otrosDatos?: any;
}
