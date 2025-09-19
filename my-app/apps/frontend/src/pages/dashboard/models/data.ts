// Mock data for dashboard

import {
  CostDataPoint,
  MachineRanking,
  CostBreakdownItem,
  RecentCalculation,
} from "./types";

export const costData: CostDataPoint[] = [
  { month: "Ene", valor: 145000 },
  { month: "Feb", valor: 152000 },
  { month: "Mar", valor: 148000 },
  { month: "Abr", valor: 165000 },
  { month: "May", valor: 158000 },
  { month: "Jun", valor: 172000 },
];

export const topMachines: MachineRanking[] = [
  { name: "CAT 320D", costo: 199.8, horas: 180 },
  { name: "Volvo EC140", costo: 175.5, horas: 165 },
  { name: "Komatsu PC200", costo: 185.2, horas: 172 },
  { name: "JCB 3CX", costo: 142.8, horas: 155 },
  { name: "Liebherr R920", costo: 220.5, horas: 145 },
];

export const costBreakdown: CostBreakdownItem[] = [
  { name: "Posesión", value: 60, color: "#3b82f6" },
  { name: "Mantenimiento", value: 25, color: "#10b981" },
  { name: "Operación", value: 15, color: "#f59e0b" },
];

export const recentCalculations: RecentCalculation[] = [
  {
    id: 1,
    machine: "CAT 320D",
    type: "Costo Horario",
    date: "2024-01-15",
    cost: "$199.80/hr",
    status: "Completado",
  },
  {
    id: 2,
    machine: "Volvo EC140",
    type: "Posesión",
    date: "2024-01-14",
    cost: "$175.50/hr",
    status: "Completado",
  },
  {
    id: 3,
    machine: "Komatsu PC200",
    type: "Costo Horario",
    date: "2024-01-13",
    cost: "$185.20/hr",
    status: "Completado",
  },
  {
    id: 4,
    machine: "JCB 3CX",
    type: "Posesión",
    date: "2024-01-12",
    cost: "$142.80/hr",
    status: "Completado",
  },
];

export const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];
