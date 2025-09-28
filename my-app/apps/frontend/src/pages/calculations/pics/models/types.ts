// Forma cruda devuelta por backend (puede traer strings en números)
export interface RawPICRecord {
  id: number;
  modelo_id: number;
  componente_id: number;
  monto_usd: number | string | null;
  pcr: number | string | null;
  distribucion: number | string | null;
  monto_aplicado_al_proyecto: number | string | null;
  fecha_efectiva: string;
  modelo?: {
    id: number;
    nombre?: string;
    marca?: { id: number; nombre: string } | null;
    equipo?: { id: number; nombre: string } | null;
    flota?: { id: number; nombre: string } | null;
  };
  componente?: { id: number; nombre: string };
}

// Forma normalizada que usa el frontend
export interface PICRecord {
  id: number;
  modelo_id: number;
  componente_id: number;
  monto_usd: number | null;
  pcr: number | null;
  distribucion: number; // siempre número (0 si null)
  monto_aplicado_al_proyecto: number; // siempre número (0 si null)
  fecha_efectiva: string;
  modelo?: {
    id: number;
    nombre?: string;
    marca?: { id: number; nombre: string } | null;
    equipo?: { id: number; nombre: string } | null;
    flota?: { id: number; nombre: string } | null;
  };
  componente?: { id: number; nombre: string };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
