import {
  DashboardKPIs,
  CostEvolutionChart,
  TopMachinesChart,
  CostBreakdownChart,
  RecentCalculations,
} from "./components";
import {
  costData,
  topMachines,
  costBreakdown,
  recentCalculations,
  COLORS,
} from "./models/data";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen general de tu gestión de costos de maquinaria
        </p>
      </div>

      {/* KPI Cards */}
      <DashboardKPIs />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostEvolutionChart data={costData} />
        <TopMachinesChart data={topMachines} />
      </div>

      {/* Cost Breakdown and Recent Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CostBreakdownChart data={costBreakdown} colors={COLORS} />
        <RecentCalculations data={recentCalculations} />
      </div>
    </div>
  );
}
