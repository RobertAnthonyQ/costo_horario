export interface Machine {
  id: number;
  modelo_id?: number;
  estado?: string;
  id_equipo_interno?: string;
  valor_similar_nuevo?: number;
  vida_util?: number;
  modelo?: {
    id: number;
    nombre: string;
    marca?: { id: number; nombre: string };
  };
}

export interface RatioType {
  id: number;
  nombre: string;
  categoria?: string;
}

export interface RatioVersionItem {
  tipo_ratio_id: number;
  tipo_ratio_nombre: string;
  valor: number | null;
  categoria: string;
}

export interface RatiosVersionJson {
  fecha_efectiva: string;
  ratios: RatioVersionItem[];
  comentario?: string;
  usuario_id?: string;
}

export interface RatioVersion {
  id: number;
  machine_id?: number;
  modelo_id?: number;
  tipo_ratio_id: number;
  valor: number | null;
  fecha_efectiva: string; // ISO string
  comentario?: string;
  ratios_version?: RatiosVersionJson | null;
  lugar_operacion?: string;
}

export interface IndividualRatioInput {
  tipo_ratio_id: number | "";
  valor: number | "";
  fecha_efectiva: string;
  comentario?: string;
  lugar_operacion?: string;
  ratios_version?: RatiosVersionJson;
}
