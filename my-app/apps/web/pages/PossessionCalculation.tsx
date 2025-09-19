import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Calculator } from "lucide-react";

export default function PossessionCalculation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Cálculo de Posesión
        </h1>
        <p className="text-muted-foreground mt-1">
          Calcula el costo total de posesión de tus máquinas
        </p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Módulo en Desarrollo</h3>
          <p className="text-muted-foreground">
            El módulo de cálculo de posesión estará disponible próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
