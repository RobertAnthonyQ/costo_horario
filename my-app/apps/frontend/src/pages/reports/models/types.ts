export interface MachineInfo {
  id: number;
  item: number;
  equipo: string;
  marca: string;
  modelo: string;
  horometroInicial: number;
  estado: string;
  idEquipo: string;
  valorSimilarNuevo: string;
  politicaDepreciacion: number;
  vidaUtil: number;
}

export interface LatestReport {
  id: number;
  fechaCalculo: string;
  tasaFinanciamiento: number;
  aniosFinanciamiento: number;
  tasaSeguro: number;
  aniosSeguro: number;
  mesPorAnio: number;
  usuarioId: string | null;
}

export interface CostSummaryScenario {
  "V.Adq ($)": number;
  Hmin: number;
  D: number; // Depreciación
  F: number; // Financiamiento
  S: number; // Seguro
  Mp: number; // Mantenimiento Preventivo
  Mc: number; // Mantenimiento Correctivo
  Est: number; // Estructural
  Neu: number; // Neumáticos
  Gets: number; // GET's (Elementos de desgaste)
  Posesión: number;
  RyM: number; // Reparación y Mantenimiento
  MOTec: number; // Mano de Obra Técnico
  Costo_Hr: number;
  U: string; // Utilidad (porcentaje)
  Tarifa: number;
}

export interface ReportParameters {
  machineId: number;
  posesionId: number;
  mesesPorAnio: number;
  tasaFinanciamiento: number;
  aniosFinanciamiento: number;
  tasaSeguro: number;
  aniosSeguro: number;
  comentario: string;
  usuarioId: string;
  incluyeGastosDistribuibles: boolean;
  costoMCorrMayores: number;
  porcentajeUtilidad: number;
  fechaCalculo: string;
}

export interface MachineReportData {
  machine: MachineInfo;
  latestReport: LatestReport;
  resumen: CostSummaryScenario[];
  parametros: ReportParameters;
  hasReports: boolean;
  totalReports: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ReportsFilters {
  searchTerm: string;
  equipoFilter: string;
  marcaFilter: string;
  estadoFilter: string;
  sortField: keyof MachineInfo | "fechaCalculo" | "costoHorario";
  sortDirection: "asc" | "desc";
}

export interface ReportsStats {
  totalMachines: number;
  totalReports: number;
  avgCostPerHour: number;
  lastUpdateDate: string;
}
