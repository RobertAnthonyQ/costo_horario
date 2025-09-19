import { KPICard } from "@/components/ui/kpi-card";
import { Truck, Calculator, DollarSign, TrendingUp } from "lucide-react";

export const DashboardKPIs = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Total Máquinas"
        value={47}
        change="+12%"
        trend="up"
        icon={Truck}
      />
      <KPICard
        title="Cálculos Este Mes"
        value={156}
        change="+23%"
        trend="up"
        icon={Calculator}
      />
      <KPICard
        title="Valor Total Activos"
        value="$2.4M"
        change="+5.2%"
        trend="up"
        icon={DollarSign}
      />
      <KPICard
        title="Rentabilidad Promedio"
        value="18.5%"
        change="-2.1%"
        trend="down"
        icon={TrendingUp}
      />
    </div>
  );
};
