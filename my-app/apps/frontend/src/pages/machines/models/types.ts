// Machine related types and interfaces

// Tipos base de relaciones
export interface Marca {
  id: number;
  nombre: string;
  created_at: string;
}

export interface Equipo {
  id: number;
  nombre: string;
  created_at: string;
}

export interface Flota {
  id: number;
  nombre: string;
  created_at: string;
}

export interface Modelo {
  id: number;
  nombre: string;
  marca_id: number;
  equipo_id?: number;
  flota_id?: number;
  porcentaje_utilidad: number;
  vida_util_fabricante?: number;
  created_at: string;
  marca?: Marca;
  equipo?: Equipo;
  flota?: Flota;
}

// Interfaz principal de Machine basada en el schema real
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
  modelo?: Modelo;
}

// DTOs para crear y actualizar
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
  // Datos adicionales para crear el modelo automáticamente
  modelo_data?: {
    nombre: string;
    marca_id: number;
    equipo_id?: number;
    porcentaje_utilidad: number;
    vida_util_fabricante?: number;
  };
}

export interface UpdateMachineDto extends Partial<CreateMachineDto> {}

// Tipos para filtros
export interface MachineFilters {
  modelo_id?: number;
  estado?: string;
  marca_id?: number;
  valor_min?: number;
  valor_max?: number;
}

// Estadísticas de máquinas
export interface MachineStats {
  total: number;
  byEstado: Array<{
    estado: string;
    _count: number;
  }>;
  averageValues: {
    valor_similar_nuevo?: number;
    valor_venta?: number;
  };
}

// Estados comunes de máquinas
export const MACHINE_ESTADOS = [
  "Capex_Nuevo",
  "activo",
  "mantenimiento",
  "inactivo",
  "fuera_servicio",
  "en_reparacion",
] as const;

export type MachineEstado = (typeof MACHINE_ESTADOS)[number];

// Tipo para modo de vista
export type ViewMode = "table" | "grid";

// Tipos para respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
