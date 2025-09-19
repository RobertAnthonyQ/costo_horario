// Possession calculation types and interfaces

export interface Scenario {
  id: number;
  horasMinimas: number;
  operatividad: number;
  factorMercado: number;
}

export interface CalculationMachine {
  id: number;
  name: string;
  value: number;
  lifeYears: number;
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
