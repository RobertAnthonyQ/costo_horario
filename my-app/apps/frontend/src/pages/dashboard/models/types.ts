// Dashboard data types and interfaces

export interface KPIData {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down";
  icon: any;
}

export interface CostDataPoint {
  month: string;
  valor: number;
}

export interface MachineRanking {
  name: string;
  costo: number;
  horas: number;
}

export interface CostBreakdownItem {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

export interface RecentCalculation {
  id: number;
  machine: string;
  type: string;
  date: string;
  cost: string;
  status: string;
}
