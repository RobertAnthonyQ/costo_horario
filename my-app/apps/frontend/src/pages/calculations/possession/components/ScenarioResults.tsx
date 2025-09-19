import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScenarioResult } from "../models/types";

interface ScenarioResultsProps {
  results: ScenarioResult[];
}

export const ScenarioResults = ({ results }: ScenarioResultsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resultados por Escenario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{result.scenario}</Badge>
                <span className="text-sm font-medium">
                  {result.hours} hrs/mes
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">V. Comercial:</span>
                  <p className="font-medium">
                    ${result.comercialValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vida Útil:</span>
                  <p className="font-medium">{result.usefulLife} años</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
