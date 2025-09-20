import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Expand } from "lucide-react";
import { ScenarioCalculationResult } from "../models/types";
import { useState } from "react";

interface IndividualResultsTableProps {
  machineName?: string;
  results?: ScenarioCalculationResult[];
  isLoading?: boolean;
}

export const IndividualResultsTable = ({
  machineName,
  results,
  isLoading = false,
}: IndividualResultsTableProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-4 w-4" />
            Resultados del Cálculo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Calculando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-4 w-4" />
            Resultados del Cálculo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="mx-auto h-12 w-12 mb-4" />
            <p>Sin resultados disponibles</p>
            <p className="text-sm">
              {machineName
                ? "Ejecuta el cálculo para ver los resultados"
                : "Selecciona una máquina primero"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Define los valores a mostrar en filas según el orden de la imagen
  const valueRows = [
    {
      label: "Horas Mínimas",
      getValue: (result: ScenarioCalculationResult) =>
        formatNumber(result.horasMinimas),
      unit: "hm",
      className: "",
    },
    {
      label: "Años de vida ideal",
      getValue: (result: ScenarioCalculationResult) =>
        formatNumber(result.aniosVidaIdeal, 1),
      unit: "",
      className: "text-green-600",
    },
    {
      label: "Vida útil del fabricante",
      getValue: (result: ScenarioCalculationResult) =>
        formatCurrency(result.vidaUtilFabricante),
      unit: "HM",
      className: "",
    },
    {
      label: "Depreciación Teórica",
      getValue: (result: ScenarioCalculationResult) =>
        formatCurrency(result.depreciacionTeorica),
      unit: "US$",
      className: "",
    },
    {
      label: "Grado de Operatividad",
      getValue: (result: ScenarioCalculationResult) =>
        formatNumber(result.gradoDeOperatividad, 2),
      unit: "-",
      className: "",
    },
    {
      label: "Valor Comercial Teórico",
      getValue: (result: ScenarioCalculationResult) =>
        formatCurrency(result.valorComercialTeorico),
      unit: "US$",
      className: "",
    },
    {
      label: "Factor de Mercado",
      getValue: (result: ScenarioCalculationResult) =>
        formatNumber(result.factorDeMercado, 2),
      unit: "-",
      className: "",
    },
    {
      label: "Valor Comercial Real",
      getValue: (result: ScenarioCalculationResult) =>
        formatCurrency(result.valorComercialReal),
      unit: "US$",
      className: "font-bold text-red-600",
    },
    {
      label: "%Valor Comercial Real",
      getValue: (result: ScenarioCalculationResult) =>
        formatNumber(result.porcentajeValorComercialReal, 2) + "%",
      unit: "%",
      className: "",
    },
    {
      label: "Depreciación Real",
      getValue: (result: ScenarioCalculationResult) =>
        formatCurrency(result.depreciacionReal),
      unit: "US$",
      className: "",
    },
    {
      label: "Depreciación Real (Anual)",
      getValue: (result: ScenarioCalculationResult) =>
        formatCurrency(result.depreciacionRealAnual),
      unit: "US$",
      className: "",
    },
    {
      label: "Depreciación Real (Horaria)",
      getValue: (result: ScenarioCalculationResult) =>
        formatNumber(result.depreciacionRealHoraria, 2),
      unit: "US$/Hr",
      className: "",
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calculator className="mr-2 h-4 w-4" />
              Resultados del Cálculo
            </CardTitle>
            {machineName && (
              <p className="text-sm text-muted-foreground mt-1">
                {machineName}
              </p>
            )}
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Expand className="h-4 w-4 mr-2" />
                Expandir
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Resultados Detallados del Cálculo</DialogTitle>
                {machineName && (
                  <p className="text-sm text-muted-foreground">{machineName}</p>
                )}
              </DialogHeader>
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-56 font-medium">
                          <div className="flex justify-between items-center">
                            <span>Valor</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              Unidad
                            </span>
                          </div>
                        </TableHead>
                        {results?.map((result, idx) => (
                          <TableHead key={idx} className="text-center min-w-32">
                            <div className="font-medium">
                              {result.horasMinimas}
                            </div>
                            <div className="text-xs text-muted-foreground font-normal">
                              Escenario {idx + 1}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {valueRows.map((row, rowIdx) => (
                        <TableRow key={rowIdx}>
                          <TableCell className="font-medium">
                            <div className="flex justify-between items-center">
                              <span>{row.label}</span>
                              <span className="text-xs text-muted-foreground font-normal ml-2">
                                {row.unit}
                              </span>
                            </div>
                          </TableCell>
                          {results?.map((result, resultIdx) => (
                            <TableCell
                              key={resultIdx}
                              className={`text-center ${row.className}`}
                            >
                              {row.getValue(result)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary Stats in Modal */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {results?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Escenarios</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {results &&
                        formatCurrency(
                          Math.max(...results.map((r) => r.valorComercialReal))
                        )}
                    </p>
                    <p className="text-sm text-muted-foreground">Mejor Valor</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {results &&
                        formatNumber(
                          Math.min(
                            ...results.map((r) => r.depreciacionRealHoraria)
                          ),
                          2
                        )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Menor Depr/Hr
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {results &&
                        formatNumber(
                          Math.max(...results.map((r) => r.aniosVidaIdeal)),
                          1
                        )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mayor Vida Útil
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-56 sticky left-0 bg-background font-medium border-r">
                  <div className="flex justify-between items-center">
                    <span>Valor</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Unidad
                    </span>
                  </div>
                </TableHead>
                {results.map((result, idx) => (
                  <TableHead key={idx} className="text-center min-w-32">
                    <div className="font-medium">{result.horasMinimas}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Escenario {idx + 1}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {valueRows.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  <TableCell className="font-medium sticky left-0 bg-background border-r">
                    <div className="flex justify-between items-center">
                      <span>{row.label}</span>
                      <span className="text-xs text-muted-foreground font-normal ml-2">
                        {row.unit}
                      </span>
                    </div>
                  </TableCell>
                  {results.map((result, resultIdx) => (
                    <TableCell
                      key={resultIdx}
                      className={`text-center ${row.className}`}
                    >
                      {row.getValue(result)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{results.length}</p>
            <p className="text-sm text-muted-foreground">Escenarios</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                Math.max(...results.map((r) => r.valorComercialReal))
              )}
            </p>
            <p className="text-sm text-muted-foreground">Mejor Valor</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {formatNumber(
                Math.min(...results.map((r) => r.depreciacionRealHoraria)),
                2
              )}
            </p>
            <p className="text-sm text-muted-foreground">Menor Depr/Hr</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {formatNumber(
                Math.max(...results.map((r) => r.aniosVidaIdeal)),
                1
              )}
            </p>
            <p className="text-sm text-muted-foreground">Mayor Vida Útil</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
