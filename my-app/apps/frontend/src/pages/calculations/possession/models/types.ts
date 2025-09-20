// Possession calculation types and interfaces

export interface Scenario {
  id: number;
  horasMinimas: number;
  gradoDeOperatividad: number;
  factorDeMercado: number;
}

// Tipos para máquinas - usando el tipo del servicio de máquinas directamente
export interface Machine {
  id: number;
  modelo_id?: number;
  estado?: string;
  horometro_inicial?: number;
  id_equipo_interno?: string;
  link_imagen?: string;
  politica_depreciacion?: number;
  tiempo_entrega?: number;
  valor_similar_nuevo?: number;
  valor_venta?: number;
  vida_util?: number;
  otros_json?: Record<string, any> | null;
  created_at?: string;
  modelo?: {
    id: number;
    nombre: string;
    marca_id: number;
    equipo_id?: number;
    flota_id?: number;
    porcentaje_utilidad: number;
    vida_util_fabricante?: number;
    created_at: string;
    marca?: {
      id: number;
      nombre: string;
      created_at: string;
    };
    equipo?: {
      id: number;
      nombre: string;
      created_at: string;
    };
    flota?: {
      id: number;
      nombre: string;
      created_at: string;
    };
  };
}

// Tipo simplificado para el componente de selección
export interface CalculationMachine {
  id: number;
  name: string;
  value: number;
  lifeYears: number;
  model: string;
  brand: string;
}

export interface PossessionVersion {
  id: number;
  machine_id: number;
  fecha_calculo: string;
  comentario?: string;
  usuario_id?: string;
  numero_escenarios: number;
}

export interface ScenarioCalculationResult {
  horasMinimas: number;
  aniosVidaIdeal: number;
  vidaUtilFabricante: number;
  depreciacionTeorica: number;
  gradoDeOperatividad: number;
  valorComercialTeorico: number;
  factorDeMercado: number;
  valorComercialReal: number;
  porcentajeValorComercialReal: number;
  depreciacionReal: number;
  depreciacionRealAnual: number;
  depreciacionRealHoraria: number;
}

export interface MachineWithVersion {
  instanceId: string; // Identificador único para esta instancia de máquina
  machine: CalculationMachine;
  selectedVersion?: PossessionVersion;
  results?: ScenarioCalculationResult[];
}

export interface TableViewData {
  scenarios: { label: string; hours: number }[];
  machines: MachineWithVersion[];
}

export interface DepreciationDataPoint {
  year: number;
  value: number;
}

export interface ScenarioResult {
  scenario: string;
  hours: number;
  comercialValue: number;
  depreciation: number;
  usefulLife: number;
}
