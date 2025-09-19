import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { RecentCalculation } from "../models/types";

interface RecentCalculationsProps {
  data: RecentCalculation[];
}

export const RecentCalculations = ({ data }: RecentCalculationsProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Últimos Cálculos Realizados
          <Button variant="outline" size="sm">
            Ver todos
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((calc) => (
            <div
              key={calc.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">{calc.machine}</p>
                  <p className="text-sm text-muted-foreground">
                    {calc.type} • {calc.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{calc.cost}</p>
                <p className="text-sm text-success">{calc.status}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
