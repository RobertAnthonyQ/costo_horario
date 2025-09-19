import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  bgColor?: string;
  textColor?: string;
}

export function KPICard({
  title,
  value,
  icon,
  bgColor = "bg-blue-50",
  textColor = "text-blue-600",
}: KPICardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              bgColor
            )}
          >
            <span className={cn("text-xl", textColor)}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
