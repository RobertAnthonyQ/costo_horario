import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ChevronRight, ChevronDown, Info } from "lucide-react";
import { MachineReportData, CostSummaryScenario } from "../models/types";

interface ReportsTableProps {
  data: MachineReportData[];
  onViewDetails?: (machineId: number, reportId: number) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDecimal = (value: number, decimals = 2) =>
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));

const estadoBadgeClasses = (estado: string) => {
  switch (estado) {
    case "Capex_Nuevo":
      return "bg-green-100 text-green-800";
    case "Operativo":
      return "bg-blue-100 text-blue-800";
    case "Mantenimiento":
      return "bg-yellow-100 text-yellow-800";
    case "Fuera_Servicio":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ScenarioSummaryTable: React.FC<{ scenarios: CostSummaryScenario[] }> = ({
  scenarios,
}) => {
  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-4">
        <Info className="h-4 w-4" />
        <span>No hay escenarios disponibles</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="w-full min-w-[880px] table-auto">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-center whitespace-nowrap">
              Hmin
            </TableHead>
            <TableHead className="text-center whitespace-nowrap">D</TableHead>
            <TableHead className="text-center whitespace-nowrap">F</TableHead>
            <TableHead className="text-center whitespace-nowrap">S</TableHead>
            <TableHead className="text-center whitespace-nowrap">
              Posesión
            </TableHead>
            <TableHead className="text-center whitespace-nowrap">RyM</TableHead>
            <TableHead className="text-center whitespace-nowrap">
              MOTec
            </TableHead>
            <TableHead className="text-center whitespace-nowrap">
              Costo/Hr
            </TableHead>
            <TableHead className="text-center whitespace-nowrap">
              Tarifa
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scenarios.map((s, idx) => (
            <TableRow key={idx} className={idx % 2 ? "bg-muted/20" : undefined}>
              <TableCell className="text-center font-medium">
                {s.Hmin}
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {formatDecimal(s.D)}
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {formatDecimal(s.F)}
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {formatDecimal(s.S)}
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {formatDecimal(s["Posesión"])}
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {formatDecimal(s.RyM)}
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {formatDecimal(s.MOTec)}
              </TableCell>
              <TableCell className="text-center font-mono text-sm font-semibold">
                ${formatDecimal(s.Costo_Hr)}
              </TableCell>
              <TableCell className="text-center font-mono text-sm font-semibold text-green-700">
                ${formatDecimal(s.Tarifa)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ReportsRow: React.FC<{
  machineData: MachineReportData;
  onViewDetails?: (machineId: number, reportId: number) => void;
}> = ({ machineData, onViewDetails }) => {
  const [expanded, setExpanded] = React.useState(false);
  const { machine, latestReport, resumen, totalReports } = machineData;
  const firstScenario = resumen?.[0];

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails && latestReport)
      onViewDetails(machine.id, latestReport.id);
  };

  return (
    <>
      <TableRow
        className="hover:bg-muted/50 cursor-pointer align-middle"
        onClick={() => setExpanded((v) => !v)}
      >
        <TableCell className="w-[44px] text-center px-2">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>

        <TableCell className="w-[320px] px-3 py-2">
          <div className="leading-tight">
            <div className="font-semibold truncate">
              {machine.equipo} • {machine.marca} {machine.modelo}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {machine.idEquipo}
            </div>
          </div>
        </TableCell>

        <TableCell className="w-[136px] text-center px-3 py-2">
          <Badge
            className={`${estadoBadgeClasses(machine.estado)} text-xs px-2 py-1`}
          >
            {machine.estado.replace("_", " ")}
          </Badge>
        </TableCell>

        <TableCell className="w-[132px] text-right font-mono tabular-nums text-sm px-3 py-2 whitespace-nowrap">
          {formatCurrency(
            firstScenario?.["V.Adq ($)"] ??
              parseInt(machine.valorSimilarNuevo || "0", 10)
          )}
        </TableCell>

        <TableCell className="w-[168px] text-center px-3 py-2 whitespace-nowrap">
          {latestReport ? formatDate(latestReport.fechaCalculo) : "-"}
        </TableCell>

        <TableCell className="w-[88px] text-center font-medium px-3 py-2">
          {firstScenario ? firstScenario.Hmin : "-"}
        </TableCell>

        <TableCell className="w-[116px] text-right px-3 py-2">
          {firstScenario ? (
            <span className="font-mono">{formatDecimal(firstScenario.D)}</span>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="w-[116px] text-right px-3 py-2">
          {firstScenario ? (
            <span className="font-mono">{formatDecimal(firstScenario.F)}</span>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="w-[116px] text-right px-3 py-2">
          {firstScenario ? (
            <span className="font-mono">{formatDecimal(firstScenario.S)}</span>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="w-[128px] text-right px-3 py-2">
          {firstScenario ? (
            <span className="font-mono">
              {formatDecimal(firstScenario["Posesión"])}
            </span>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="w-[116px] text-right px-3 py-2">
          {firstScenario ? (
            <span className="font-mono">
              {formatDecimal(firstScenario.RyM)}
            </span>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="w-[116px] text-right px-3 py-2">
          {firstScenario ? (
            <span className="font-mono">
              {formatDecimal(firstScenario.MOTec)}
            </span>
          ) : (
            "-"
          )}
        </TableCell>

        <TableCell className="w-[124px] text-right px-3 py-2">
          {firstScenario ? (
            <span className="font-mono font-semibold">
              ${formatDecimal(firstScenario.Costo_Hr)}
            </span>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="w-[124px] text-right px-3 py-2">
          {firstScenario ? (
            <span className="font-mono font-bold text-green-700">
              ${formatDecimal(firstScenario.Tarifa)}
            </span>
          ) : (
            "-"
          )}
        </TableCell>

        <TableCell className="w-[84px] text-center px-3 py-2">
          <Badge variant="secondary" className="font-mono text-xs px-2 py-1">
            {totalReports}
          </Badge>
        </TableCell>

        <TableCell className="w-[56px] text-center px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleView}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow>
          <TableCell colSpan={15} className="bg-muted/20 p-0">
            <div className="p-4">
              <ScenarioSummaryTable scenarios={resumen} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export const ReportsTable: React.FC<ReportsTableProps> = ({
  data,
  onViewDetails,
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground space-y-2">
            <Info className="h-12 w-12 mx-auto mb-2 text-muted-foreground/60" />
            <h3 className="text-lg font-medium">No hay reportes disponibles</h3>
            <p className="text-sm">
              Aún no se han generado reportes de costo horario para ninguna
              máquina.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[1400px] table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[44px] text-center">#</TableHead>
                <TableHead className="w-[320px]">Equipo</TableHead>
                <TableHead className="w-[136px] text-center">Estado</TableHead>
                <TableHead className="w-[132px] text-right">
                  V.Adq ($)
                </TableHead>
                <TableHead className="w-[168px] text-center">
                  Último reporte
                </TableHead>
                <TableHead className="w-[88px] text-center">Hmin</TableHead>
                <TableHead className="w-[116px] text-right">D</TableHead>
                <TableHead className="w-[116px] text-right">F</TableHead>
                <TableHead className="w-[116px] text-right">S</TableHead>
                <TableHead className="w-[128px] text-right">Posesión</TableHead>
                <TableHead className="w-[116px] text-right">RyM</TableHead>
                <TableHead className="w-[116px] text-right">MOTec</TableHead>
                <TableHead className="w-[124px] text-right">Costo/Hr</TableHead>
                <TableHead className="w-[124px] text-right">Tarifa</TableHead>
                <TableHead className="w-[84px] text-center">Reportes</TableHead>
                <TableHead className="w-[56px] text-center">Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((m) => (
                <ReportsRow
                  key={m.machine.id}
                  machineData={m}
                  onViewDetails={onViewDetails}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
