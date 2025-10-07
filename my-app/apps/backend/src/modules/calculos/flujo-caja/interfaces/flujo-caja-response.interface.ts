// Interfaz para datos precargados desde informe de costo horario
export interface DatosPrecargadosInforme {
  // Información básica de la máquina
  valorAdquisicion: number; // valor_similar_nuevo
  vidaUtilFabricante: number; // vida_util de la máquina
  mesesAlAnio: number; // mes_por_anio del informe

  // Escenarios de horas desde posesion_historial
  escenariosHoras: {
    horasMinimas: number;
    gradoOperatividad: number;
    factorMercado: number;
    horasUsoAnual: number; // calculado: horasMinimas * mesesAlAnio
    seguroTrec: number; // seguroTrec específico de cada escenario
  }[];

  // Totales de mantenimiento desde el cálculo del informe
  totalPosesionMantenimiento: number; // suma de posesión + mantenimiento

  // Desglose de mantenimiento (Sección 4 del informe)
  mantenimiento: {
    preventivo: number; // lubricantes + filtros + materiales ferretería
    correctivo: number; // materiales eléctricos + mangueras + menores + mayores
    neumaticos: number;
    elementosDesgaste: number; // gets
    soldadura: number; // estructural
    manoDeObraSupervision: number; // mano_de_obra_tecnico o calculado
  };

  // Prima/Seguro (TREC) - Sección 3
  primaSeguroTrec: number; // seguroTrec del informe

  // Información del informe de origen
  informeOrigen: {
    id: number;
    fechaCalculo: Date;
    tasaFinanciamiento: number;
    aniosFinanciamiento: number;
    tasaSeguro: number;
    porcentajeUtilidad: number;
  };
}

// Interfaz principal de respuesta para análisis de flujo de caja
export interface FlujoCajaResponse {
  // Identificación del análisis
  analisisId?: number;

  // Información de la máquina
  machine: {
    id: number;
    item: number;
    equipo: string | null;
    marca: string | null;
    modelo: string | null;
    estado: string | null;
    idEquipo: number | null;
  };

  // Datos precargados desde informe de costo horario
  datosPrecargados: DatosPrecargadosInforme;

  // Parámetros utilizados en el análisis
  parametros: {
    porcentajeResidual: number;
    margenInterno: number;
    gastosGeneralesMantenimiento: number;
    horasOperativasMes: number;
    tasaDescuentoEmpresa: number;
    usuarioId?: string;
    fechaCalculo: string;
    comentario?: string;
  };

  // Estado del análisis
  estado: 'precargado' | 'calculado' | 'guardado';

  // Resultado del cálculo de flujo (se llenará después de los cálculos)
  resultadoFlujo?: any;

  // Datos adicionales flexibles
  otrosDatos?: any;
}
