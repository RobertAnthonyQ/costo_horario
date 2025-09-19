import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export function KPICard({ title, value, change, trend, icon: Icon, className }: KPICardProps) {
  const trendColor = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-secondary"
  }[trend || "neutral"];

  return (
    <Card className={cn("transition-shadow hover:shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <p className={cn("text-xs", trendColor)}>
            {change} desde el mes anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}