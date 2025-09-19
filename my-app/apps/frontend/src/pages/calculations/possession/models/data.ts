// Mock data for possession calculation

import {
  CalculationMachine,
  DepreciationDataPoint,
  ScenarioResult,
} from "./types";

export const machines: CalculationMachine[] = [
  { id: 1, name: "CAT 320D - EQ001", value: 150000, lifeYears: 10 },
  { id: 2, name: "Volvo EC140D - EQ003", value: 135000, lifeYears: 12 },
  { id: 3, name: "JCB 3CX - EQ004", value: 95000, lifeYears: 8 },
  { id: 4, name: "Komatsu PC200-8 - EQ005", value: 125000, lifeYears: 10 },
];

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
