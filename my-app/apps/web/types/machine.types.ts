// Tipos basados en el backend de máquinas

export interface Machine {
  id: number;
  modelo_id?: number | null;
  estado?: string | null;
  horometro_inicial?: number | null;
  link_imagen?: string | null;
  politica_depreciacion?: number | null;
  tiempo_entrega?: number | null;
  valor_similar_nuevo?: number | null;
  valor_venta?: number | null;
  vida_util?: number | null;
  otros_json?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;

  // Relaciones
  modelo?: {
    id: number;
    nombre: string;
    marca?: {
      id: number;
      nombre: string;
    };
    equipo?: {
      id: number;
      nombre: string;
    };
    flota?: {
      id: number;
      nombre: string;
    };
  } | null;
}

export interface CreateMachineDto {
  modelo_id?: number;
  estado?: string;
  horometro_inicial?: number;
  link_imagen?: string;
  politica_depreciacion?: number;
  tiempo_entrega?: number;
  valor_similar_nuevo?: number;
  valor_venta?: number;
  vida_util?: number;
  otros_json?: Record<string, any> | null;
}

export interface UpdateMachineDto extends Partial<CreateMachineDto> {}

export interface MachineFilters {
  modelo_id?: number;
  estado?: string;
  marca_id?: number;
  valor_min?: number;
  valor_max?: number;
  search?: string;
}

export interface MachineStatistics {
  total: number;
  byEstado: Array<{
    estado: string | null;
    _count: number;
  }>;
  averageValues: {
    valor_similar_nuevo: number | null;
    valor_venta: number | null;
  };
}

// Estados posibles de las máquinas
export const MACHINE_ESTADOS = [
  "Activo",
  "Mantenimiento",
  "Inactivo",
  "En Reparación",
  "Vendido",
  "Capex_Nuevo",
] as const;

export type MachineEstado = (typeof MACHINE_ESTADOS)[number];
