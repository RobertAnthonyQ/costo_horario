export interface RatioVersionItem {
  tipo_ratio_id: number;
  tipo_ratio_nombre: string;
  valor: number | null;
  categoria?: string;
}

export interface RatiosVersion {
  fecha_efectiva: string; // ISO date string
  ratios: RatioVersionItem[];
  comentario?: string;
  usuario_id?: string;
}
