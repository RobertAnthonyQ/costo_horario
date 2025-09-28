import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Truck,
  FileText,
  DollarSign,
  Clock,
  Activity,
} from "lucide-react";
import { ReportsStats } from "../models/types";

interface ReportsStatsCardsProps {
  stats: ReportsStats | null;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
};

export const ReportsStatsCards: React.FC<ReportsStatsCardsProps> = ({
  stats,
  isLoading,
}) => {
  const statsData = [
    {
      title: "Máquinas con Reportes",
      value: stats?.totalMachines || 0,
      icon: Truck,
      description: "Total de equipos analizados",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Reportes Generados",
      value: stats?.totalReports || 0,
      icon: FileText,
      description: "Informes de costo horario",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Costo Promedio/Hora",
      value: formatCurrency(stats?.avgCostPerHour || 0),
      icon: DollarSign,
      description: "Promedio por equipo",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Última Actualización",
      value: stats?.lastUpdateDate ? formatDate(stats.lastUpdateDate) : "-",
      icon: Clock,
      description: "Reporte más reciente",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsData.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  {isLoading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold tracking-tight">
                      {stat.value}
                    </p>
                  )}
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
