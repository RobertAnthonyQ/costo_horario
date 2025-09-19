import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Truck,
  Building2,
  Calculator,
  TrendingUp,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Resumen general del sistema de gestión de costos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="animate-slide-up border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Máquinas
                </p>
                <p className="text-3xl font-bold text-foreground">47</p>
                <p className="text-xs text-success font-medium bg-success-light px-2 py-1 rounded-full">
                  +2 este mes
                </p>
              </div>
              <div className="p-3 bg-primary-light rounded-xl">
                <Truck className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="animate-slide-up border-l-4 border-l-success"
          style={{ animationDelay: "0.1s" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Valor Total Flota
                </p>
                <p className="text-3xl font-bold text-foreground">$2.4M</p>
                <p className="text-xs text-success font-medium bg-success-light px-2 py-1 rounded-full">
                  +5.2% vs mes anterior
                </p>
              </div>
              <div className="p-3 bg-success-light rounded-xl">
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="animate-slide-up border-l-4 border-l-secondary"
          style={{ animationDelay: "0.2s" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Cálculos Realizados
                </p>
                <p className="text-3xl font-bold text-foreground">156</p>
                <p className="text-xs text-success font-medium bg-success-light px-2 py-1 rounded-full">
                  +12 esta semana
                </p>
              </div>
              <div className="p-3 bg-secondary-light rounded-xl">
                <Calculator className="h-8 w-8 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="animate-slide-up border-l-4 border-l-warning"
          style={{ animationDelay: "0.3s" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Alertas Activas
                </p>
                <p className="text-3xl font-bold text-warning">3</p>
                <p className="text-xs text-muted-foreground font-medium bg-warning-light px-2 py-1 rounded-full">
                  Mantenimientos pendientes
                </p>
              </div>
              <div className="p-3 bg-warning-light rounded-xl">
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-primary-light hover:border-primary transition-all duration-200 cursor-pointer group hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary-light rounded-lg group-hover:bg-primary group-hover:text-white transition-all duration-200">
                  <Truck className="h-5 w-5 text-primary group-hover:text-white" />
                </div>
                <span className="font-medium text-foreground">
                  Registrar Nueva Máquina
                </span>
              </div>
              <span className="text-muted-foreground group-hover:text-primary transition-colors duration-200">
                →
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-success-light hover:border-success transition-all duration-200 cursor-pointer group hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-success-light rounded-lg group-hover:bg-success group-hover:text-white transition-all duration-200">
                  <Calculator className="h-5 w-5 text-success group-hover:text-white" />
                </div>
                <span className="font-medium text-foreground">
                  Calcular Costo de Posesión
                </span>
              </div>
              <span className="text-muted-foreground group-hover:text-success transition-colors duration-200">
                →
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary-light hover:border-secondary transition-all duration-200 cursor-pointer group hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-secondary-light rounded-lg group-hover:bg-secondary group-hover:text-white transition-all duration-200">
                  <TrendingUp className="h-5 w-5 text-secondary group-hover:text-white" />
                </div>
                <span className="font-medium text-foreground">
                  Ver Reportes
                </span>
              </div>
              <span className="text-muted-foreground group-hover:text-secondary transition-colors duration-200">
                →
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">
              Máquinas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200 hover-lift">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  EQ-001 - Excavadora Caterpillar
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Activa • 2,840 hrs
                </p>
              </div>
              <span className="text-success text-sm font-medium bg-success-light px-3 py-1 rounded-full">
                Activa
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200 hover-lift">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  EQ-002 - Camión Ford
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Mantenimiento • 5,420 hrs
                </p>
              </div>
              <span className="text-warning text-sm font-medium bg-warning-light px-3 py-1 rounded-full">
                Mantenimiento
              </span>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200 hover-lift">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  EQ-003 - Excavadora Volvo
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Activa • 1,650 hrs
                </p>
              </div>
              <span className="text-success text-sm font-medium bg-success-light px-3 py-1 rounded-full">
                Activa
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
