import { Card, CardContent } from "@/components/ui/card";
import { Truck, Building2, AlertTriangle, Activity } from "lucide-react";
import { Machine } from "../models/types";
import { formatCurrency } from "../models/data";

interface MachineStatsProps {
  machines: Machine[];
}

export const MachineStats = ({ machines }: MachineStatsProps) => {
  // Calcular estadísticas
  const totalMachines = machines.length;

  const activeCount = machines.filter((m) => m.estado === "activo").length;
  const maintenanceCount = machines.filter(
    (m) => m.estado === "mantenimiento" || m.estado === "en_reparacion"
  ).length;
  const inactiveCount = machines.filter(
    (m) => m.estado === "inactivo" || m.estado === "fuera_servicio"
  ).length;

  const totalValueNew = machines.reduce(
    (sum, machine) => sum + (machine.valor_similar_nuevo || 0),
    0
  );

  const totalValueSell = machines.reduce(
    (sum, machine) => sum + (machine.valor_venta || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Máquinas</p>
              <p className="text-2xl font-bold text-foreground">
                {totalMachines}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Valor nuevo: {formatCurrency(totalValueNew)}
              </p>
            </div>
            <Truck className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Activas</p>
              <p className="text-2xl font-bold text-success">{activeCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalMachines > 0
                  ? Math.round((activeCount / totalMachines) * 100)
                  : 0}
                % del total
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En Mantenimiento</p>
              <p className="text-2xl font-bold text-warning">
                {maintenanceCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalMachines > 0
                  ? Math.round((maintenanceCount / totalMachines) * 100)
                  : 0}
                % del total
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inactivas</p>
              <p className="text-2xl font-bold text-secondary">
                {inactiveCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Valor venta: {formatCurrency(totalValueSell)}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
