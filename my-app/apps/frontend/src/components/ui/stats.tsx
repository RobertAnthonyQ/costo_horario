import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  trend,
  trendValue,
  icon,
  className = "",
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center space-x-1 mt-2">
            {getTrendIcon()}
            <span className={`text-xs ${getTrendColor()}`}>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface StatsSummaryProps {
  total: number;
  withModels?: number;
  withoutModels?: number;
  entityName: string;
  className?: string;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  total,
  withModels,
  withoutModels,
  entityName,
  className = "",
}) => {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      <StatsCard
        title={`Total ${entityName}`}
        value={total}
        description={`Cantidad total de ${entityName.toLowerCase()} registradas`}
      />
      {withModels !== undefined && (
        <StatsCard
          title="Con Modelos"
          value={withModels}
          description={`${entityName} que tienen modelos asociados`}
          trend={withModels > 0 ? "up" : "neutral"}
        />
      )}
      {withoutModels !== undefined && (
        <StatsCard
          title="Sin Modelos"
          value={withoutModels}
          description={`${entityName} sin modelos asociados`}
          trend={withoutModels > 0 ? "down" : "up"}
        />
      )}
    </div>
  );
};
