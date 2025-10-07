/**
 * Interfaz para los datos adicionales de la máquina almacenados en otros_json
 */
export interface DatosAdicionalesMaquina {
  /** País de procedencia de la máquina */
  procedencia_pais?: string;

  /** Potencia nominal en caballos de fuerza (HP) */
  potencia_nominal_hp?: string;

  /** Consumo de combustible en litros por hora */
  consumo_combustible_lh?: number;

  /** Número de equipos comercializados por la marca en Perú */
  equipos_comercializados_peru?: number;

  /** Plazo de entrega del equipo en días */
  plazo_entrega_dias?: number;

  /** Horas de capacitación a operadores y técnicos */
  capacitacion_horas?: number;

  /** Tiempo promedio de atención de repuestos en días */
  tiempo_atencion_repuestos_dias?: number;

  /** Indica si ofrece financiamiento */
  ofrece_financiamiento?: boolean;
}

/**
 * Tipo extendido para una máquina con datos adicionales tipados
 */
export interface MachineConDatosAdicionales {
  id: number;
  modelo_id?: number;
  id_equipo_interno?: string;
  valor_venta?: number;
  tiempo_entrega?: number;
  estado?: string;
  valor_similar_nuevo?: number;
  horometro_inicial?: number;
  vida_util?: number;
  politica_depreciacion?: number;
  link_imagen?: string;
  otros_json?: DatosAdicionalesMaquina;
  created_at?: Date;
  modelo?: any; // Relación con el modelo
}
