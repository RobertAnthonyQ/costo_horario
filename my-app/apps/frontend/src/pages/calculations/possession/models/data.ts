// Mock data for possession calculation

import {
  CalculationMachine,
  DepreciationDataPoint,
  ScenarioResult,
  PossessionVersion,
  ScenarioCalculationResult,
  MachineWithVersion,
  TableViewData,
} from "./types";

export const machines: CalculationMachine[] = [
  {
    id: 1,
    name: "CAT 320D - EQ001",
    value: 150000,
    lifeYears: 10,
    brand: "CAT",
    model: "320D",
  },
  {
    id: 2,
    name: "Volvo EC140D - EQ003",
    value: 135000,
    lifeYears: 12,
    brand: "Volvo",
    model: "EC140D",
  },
  {
    id: 3,
    name: "JCB 3CX - EQ004",
    value: 95000,
    lifeYears: 8,
    brand: "JCB",
    model: "3CX",
  },
  {
    id: 4,
    name: "Komatsu PC200-8 - EQ005",
    value: 125000,
    lifeYears: 10,
    brand: "Komatsu",
    model: "PC200-8",
  },
];

// Versiones de posesión de ejemplo
export const mockPossessionVersions: PossessionVersion[] = [
  {
    id: 15,
    machine_id: 1,
    fecha_calculo: "2025-09-19T10:30:00.000Z",
    comentario: "Análisis de viabilidad económica",
    usuario_id: "user-uuid-123",
    numero_escenarios: 3,
  },
  {
    id: 14,
    machine_id: 1,
    fecha_calculo: "2025-09-18T15:20:00.000Z",
    comentario: "Evaluación preliminar",
    numero_escenarios: 2,
  },
  {
    id: 13,
    machine_id: 2,
    fecha_calculo: "2025-09-17T09:15:00.000Z",
    comentario: "Cálculo conservador",
    numero_escenarios: 4,
  },
  {
    id: 12,
    machine_id: 3,
    fecha_calculo: "2025-09-16T14:00:00.000Z",
    comentario: "Análisis optimista",
    numero_escenarios: 3,
  },
];

// Resultados de ejemplo para los escenarios - basados en estructura real del backend
export const mockScenarioResults: Record<number, ScenarioCalculationResult[]> =
  {
    1: [
      // CAT 320D
      {
        horasMinimas: 400,
        aniosVidaIdeal: 6.25,
        vidaUtilFabricante: 30000,
        depreciacionTeorica: 135000,
        gradoDeOperatividad: 0.8667,
        valorComercialTeorico: 15000,
        factorDeMercado: 0.6333,
        valorComercialReal: 63121.33,
        porcentajeValorComercialReal: 5.49,
        depreciacionReal: 1086878.67,
        depreciacionRealAnual: 173900.59,
        depreciacionRealHoraria: 36.23,
      },
      {
        horasMinimas: 450,
        aniosVidaIdeal: 5.56,
        vidaUtilFabricante: 30000,
        depreciacionTeorica: 135000,
        gradoDeOperatividad: 0.8333,
        valorComercialTeorico: 15829.5,
        factorDeMercado: 0.5917,
        valorComercialReal: 56702.32,
        porcentajeValorComercialReal: 4.93,
        depreciacionReal: 1093297.68,
        depreciacionRealAnual: 196793.58,
        depreciacionRealHoraria: 36.44,
      },
      {
        horasMinimas: 500,
        aniosVidaIdeal: 5.0,
        vidaUtilFabricante: 30000,
        depreciacionTeorica: 135000,
        gradoDeOperatividad: 0.8,
        valorComercialTeorico: 12000,
        factorDeMercado: 0.55,
        valorComercialReal: 50600,
        porcentajeValorComercialReal: 4.4,
        depreciacionReal: 1099400,
        depreciacionRealAnual: 219880,
        depreciacionRealHoraria: 36.65,
      },
    ],
    2: [
      // Volvo EC140D
      {
        horasMinimas: 350,
        aniosVidaIdeal: 7.14,
        vidaUtilFabricante: 30000,
        depreciacionTeorica: 121500,
        gradoDeOperatividad: 0.9,
        valorComercialTeorico: 13500,
        factorDeMercado: 0.675,
        valorComercialReal: 69862.5,
        porcentajeValorComercialReal: 6.08,
        depreciacionReal: 1080137.5,
        depreciacionRealAnual: 151219.25,
        depreciacionRealHoraria: 36.0,
      },
      {
        horasMinimas: 400,
        aniosVidaIdeal: 6.25,
        vidaUtilFabricante: 30000,
        depreciacionTeorica: 121500,
        gradoDeOperatividad: 0.8667,
        valorComercialTeorico: 11700,
        factorDeMercado: 0.6333,
        valorComercialReal: 63121.33,
        porcentajeValorComercialReal: 5.49,
        depreciacionReal: 1071878.67,
        depreciacionRealAnual: 171500.59,
        depreciacionRealHoraria: 35.81,
      },
    ],
    3: [
      // JCB 3CX
      {
        horasMinimas: 250,
        aniosVidaIdeal: 10.0,
        vidaUtilFabricante: 25000,
        depreciacionTeorica: 85500,
        gradoDeOperatividad: 0.9667,
        valorComercialTeorico: 9500,
        factorDeMercado: 0.7583,
        valorComercialReal: 84300.59,
        porcentajeValorComercialReal: 7.33,
        depreciacionReal: 865699.41,
        depreciacionRealAnual: 86569.94,
        depreciacionRealHoraria: 35.52,
      },
      {
        horasMinimas: 300,
        aniosVidaIdeal: 8.33,
        vidaUtilFabricante: 25000,
        depreciacionTeorica: 85500,
        gradoDeOperatividad: 0.9333,
        valorComercialTeorico: 9500,
        factorDeMercado: 0.7167,
        valorComercialReal: 76923.05,
        porcentajeValorComercialReal: 6.69,
        depreciacionReal: 873076.95,
        depreciacionRealAnual: 104769.23,
        depreciacionRealHoraria: 35.77,
      },
    ],
    4: [
      // Komatsu PC200-8
      {
        horasMinimas: 200,
        aniosVidaIdeal: 12.5,
        vidaUtilFabricante: 30000,
        depreciacionTeorica: 112500,
        gradoDeOperatividad: 1.0,
        valorComercialTeorico: 12500,
        factorDeMercado: 0.8,
        valorComercialReal: 92000,
        porcentajeValorComercialReal: 8.0,
        depreciacionReal: 1058000,
        depreciacionRealAnual: 84640,
        depreciacionRealHoraria: 35.27,
      },
      {
        horasMinimas: 250,
        aniosVidaIdeal: 10.0,
        vidaUtilFabricante: 30000,
        depreciacionTeorica: 112500,
        gradoDeOperatividad: 0.9667,
        valorComercialTeorico: 12083.5,
        factorDeMercado: 0.7583,
        valorComercialReal: 84300.59,
        porcentajeValorComercialReal: 7.33,
        depreciacionReal: 1065699.41,
        depreciacionRealAnual: 106569.94,
        depreciacionRealHoraria: 35.52,
      },
    ],
  };

// Datos para la vista de tabla
export const mockTableViewData: TableViewData = {
  scenarios: [],
  machines: [],
};

export const depreciationData: DepreciationDataPoint[] = [
  { year: 0, value: 150000 },
  { year: 2, value: 135000 },
  { year: 4, value: 118000 },
  { year: 6, value: 95000 },
  { year: 8, value: 72000 },
  { year: 10, value: 45000 },
  { year: 12, value: 30000 },
];

export const scenarioResults: ScenarioResult[] = [
  {
    scenario: "Escenario 1",
    hours: 200,
    comercialValue: 95000,
    depreciation: 55000,
    usefulLife: 12.5,
  },
  {
    scenario: "Escenario 2",
    hours: 250,
    comercialValue: 87000,
    depreciation: 63000,
    usefulLife: 10.0,
  },
  {
    scenario: "Escenario 3",
    hours: 300,
    comercialValue: 82000,
    depreciation: 68000,
    usefulLife: 8.3,
  },
];
