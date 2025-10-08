import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlujoCajaResponse, FlujoCajaParametros } from "../models/types";

interface ReportDisplayProps {
  report: FlujoCajaResponse | null;
  selectedMachine: any;
  showReportModal: boolean;
  onCloseModal: () => void;
}

export function ReportDisplay({
  report,
  selectedMachine,
  showReportModal,
  onCloseModal,
}: ReportDisplayProps) {
  // Debug logging básico
  console.log(
    "🔍 ReportDisplay - Modal abierto:",
    showReportModal,
    "Tiene datos:",
    !!report
  );

  // Temporal: Log para debug de estructura de datos
  if (report) {
    console.log("📊 Report completo:", report);
    console.log("📊 Machine data:", report.machine);
    console.log("📊 Parametros:", report.parametros);
    console.log("📊 ResultadoFlujo:", report.resultadoFlujo);
  }

  // Monitor modal state changes
  React.useEffect(() => {
    console.log("🔄 Modal state changed:", showReportModal);
  }, [showReportModal]);

  if (!report) {
    console.log("❌ ReportDisplay: No report data");
    return null;
  }

  // Helper para extraer parámetros de diferentes ubicaciones posibles
  const getParameter = (paramName: string, defaultValue: any = 0) => {
    // Aliases any-cast para soportar estructuras alternativas (preview vs histórico)
    const anyReport = report as any;
    const rfj = anyReport?.resultado_flujo_json; // variante snake_case
    const rf = report.resultadoFlujo || anyReport?.resultadoFlujo; // variante camelCase
    const odj = anyReport?.otros_datos_json || anyReport?.otrosDatos; // guardados
    const odjParams = odj?.parametros;
    const odjRfj = odj?.resultado_flujo_json || odj?.resultadoFlujo;
    // Mapeo de nombres de parámetros a campos específicos de resultado_flujo_json
    const resultadoFlujoMap: { [key: string]: string } = {
      porcentajeResidual: "valorResidual", // Necesitará cálculo: valorResidual / valorAdquisicion
      margenInterno: "margenInterno",
      gastosGeneralesMantenimiento: "gastos_generales_mantenimiento",
      tasaDescuentoEmpresa: "tasaDescuentoEmpresa",
      valorAdquisicion: "valorAdquisicion",
      valorDepreciacion: "valorDepreciacion",
      vidaUtilHoras: "vidaUtilHoras",
    };

    // Intentar diferentes ubicaciones donde pueden estar los parámetros
    const sources = [
      (report as any)?.[paramName],
      report.parametros?.[paramName as keyof FlujoCajaParametros],
      odj?.[paramName],
      odjParams?.[paramName],
      // Agregar resultado_flujo_json/camelCase como fuente
      resultadoFlujoMap[paramName]
        ? (rfj?.[resultadoFlujoMap[paramName]] ??
          rf?.[resultadoFlujoMap[paramName]])
        : undefined,
      // También buscar en odjRfj si el resultado quedó guardado dentro de otros_datos_json/otrosDatos
      resultadoFlujoMap[paramName]
        ? odjRfj?.[resultadoFlujoMap[paramName]]
        : undefined,
    ];

    // Casos especiales que necesitan cálculo
    if (paramName === "porcentajeResidual") {
      const valorResidual =
        rfj?.valorResidual || rf?.valorResidual || odjRfj?.valorResidual;
      const valorAdquisicion =
        rfj?.valorAdquisicion ||
        rf?.valorAdquisicion ||
        odjRfj?.valorAdquisicion;
      if (valorResidual && valorAdquisicion && valorAdquisicion > 0) {
        return valorResidual / valorAdquisicion;
      }
    }

    // gastos_generales_mantenimiento viene como porcentaje ya (2.16 = 2.16%)
    if (paramName === "gastosGeneralesMantenimiento") {
      const gastosGenerales =
        rfj?.gastos_generales_mantenimiento ||
        rf?.gastos_generales_mantenimiento ||
        odjRfj?.gastos_generales_mantenimiento;
      if (gastosGenerales !== undefined && gastosGenerales !== null) {
        return gastosGenerales / 100; // Convertir de porcentaje a decimal para formatPercentage
      }
    }

    // margenInterno viene como decimal (0.1 = 10%)
    if (paramName === "margenInterno") {
      const margen =
        rfj?.margenInterno || rf?.margenInterno || odjRfj?.margenInterno;
      if (margen !== undefined && margen !== null) {
        return margen; // Ya está en formato decimal correcto
      }
    }

    // tasaDescuentoEmpresa - buscar en varias fuentes posibles (incluyendo rutas anidadas y snake_case)
    if (paramName === "tasaDescuentoEmpresa") {
      const tasaCandidates: any[] = [
        // Top-level en ambos formatos de respuesta
        rfj?.tasaDescuentoEmpresa,
        rf?.tasaDescuentoEmpresa,
        // Equivalente snake_case en top-level
        rfj?.tasa_descuento_empresa,
        (rf as any)?.tasa_descuento_empresa,
        // Rutas potenciales anidadas dentro del flujo (rfj)
        rfj?.FlujoDecajaOperacion?.reporteFinalConsolidado?.analisisFinanciero
          ?.tasaDescuentoEmpresa,
        rfj?.FlujoDecajaOperacion?.reporteFinalConsolidado?.analisisFinanciero
          ?.tasaDescuento,
        rfj?.FlujoDecajaOperacion?.reporteFinalConsolidado?.analisisFinanciero
          ?.tasa_descuento,
        rfj?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.tasaDescuentoEmpresa,
        rfj?.FlujoDecajaOperacion?.parametros?.tasaDescuentoEmpresa,
        rfj?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.tasa_descuento_empresa,
        rfj?.FlujoDecajaOperacion?.parametros?.tasa_descuento_empresa,
        // Equivalentes para rf (camelCase)
        (rf as any)?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.analisisFinanciero?.tasaDescuentoEmpresa,
        (rf as any)?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.analisisFinanciero?.tasaDescuento,
        (rf as any)?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.analisisFinanciero?.tasa_descuento,
        (rf as any)?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.tasaDescuentoEmpresa,
        (rf as any)?.FlujoDecajaOperacion?.parametros?.tasaDescuentoEmpresa,
        (rf as any)?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.tasa_descuento_empresa,
        (rf as any)?.FlujoDecajaOperacion?.parametros?.tasa_descuento_empresa,
        // Parámetros u opciones en otros lugares
        report.parametros?.tasaDescuentoEmpresa,
        (report.parametros as any)?.tasa_descuento_empresa,
        odjParams?.tasaDescuentoEmpresa,
        (odjParams as any)?.tasa_descuento_empresa,
        odj?.tasaDescuentoEmpresa,
        odj?.tasa_descuento_empresa,
        // Cuando el resultado completo se guarda bajo otros_datos_json/otrosDatos
        odjRfj?.tasaDescuentoEmpresa,
        odjRfj?.tasa_descuento_empresa,
        odjRfj?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.analisisFinanciero?.tasaDescuentoEmpresa,
        odjRfj?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.analisisFinanciero?.tasaDescuento,
        odjRfj?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.analisisFinanciero?.tasa_descuento,
        odjRfj?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.tasaDescuentoEmpresa,
        odjRfj?.FlujoDecajaOperacion?.reporteFinalConsolidado
          ?.tasa_descuento_empresa,
        odjRfj?.FlujoDecajaOperacion?.parametros?.tasaDescuentoEmpresa,
        odjRfj?.FlujoDecajaOperacion?.parametros?.tasa_descuento_empresa,
        (anyReport as any)?.tasaDescuentoEmpresa,
      ];

      for (const raw of tasaCandidates) {
        if (raw !== undefined && raw !== null && raw !== "") {
          // Convertir a número si viene como string
          const n = typeof raw === "string" ? Number(raw) : raw;
          if (!Number.isNaN(n)) {
            // Normalizar: si viene en 0-100, convertir a 0-1
            if (n > 1 && n <= 100) return n / 100;
            return n;
          }
        }
      }
    }

    for (const value of sources) {
      if (value !== undefined && value !== null) {
        return value;
      }
    }

    return defaultValue;
  };

  // Helper para extraer información de la máquina
  const getMachineInfo = (field: string, defaultValue: string = "—") => {
    let sources: any[] = [];
    const anyReport = report as any;
    const odj = anyReport?.otros_datos_json || anyReport?.otrosDatos;

    // Mapear cada campo a sus posibles ubicaciones
    switch (field) {
      case "equipo":
        sources = [
          selectedMachine?.modelo?.equipo?.nombre,
          report.machine?.equipo,
          odj?.machine?.equipo,
        ];
        break;
      case "marca":
        sources = [
          selectedMachine?.modelo?.marca?.nombre,
          report.machine?.marca,
          odj?.machine?.marca,
        ];
        break;
      case "modelo":
        sources = [
          selectedMachine?.modelo?.nombre,
          selectedMachine?.nombre,
          report.machine?.modelo,
          odj?.machine?.modelo,
        ];
        break;
      default:
        sources = [
          selectedMachine?.[field],
          report.machine?.[field],
          odj?.machine?.[field],
        ];
    }

    for (const value of sources) {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        typeof value === "string"
      ) {
        return value;
      }
    }

    return defaultValue;
  };

  // Helper para acceder a datos precargados
  const getDatosPrecargados = () => {
    const anyReport = report as any;
    const odj = anyReport?.otros_datos_json || anyReport?.otrosDatos;
    const precargados = report.datosPrecargados || odj?.datosPrecargados;
    const resultadoFlujo =
      anyReport?.resultado_flujo_json ||
      report.resultadoFlujo ||
      odj?.resultado_flujo_json ||
      odj?.resultadoFlujo;

    // Si hay datos precargados tradicionales, usarlos
    if (precargados) {
      return precargados;
    }

    // Si no, crear un objeto con los datos de resultado_flujo_json
    if (resultadoFlujo) {
      return {
        valorAdquisicion: resultadoFlujo.valorAdquisicion,
        vidaUtilFabricante: resultadoFlujo.vidaUtilHoras,
        informeOrigen: resultadoFlujo.fechaCalculo
          ? {
              fechaCalculo: resultadoFlujo.fechaCalculo,
            }
          : undefined,
      };
    }

    return null;
  };

  // Helper para leer valores de mantenimiento por hora desde datos precargados
  const getMantenimientoUnitario = (
    campo: string,
    defaultValue: number = 0
  ) => {
    const anyReport = report as any;
    const odj = anyReport?.otros_datos_json || anyReport?.otrosDatos;
    const rfj = anyReport?.resultado_flujo_json || anyReport?.resultadoFlujo;

    const candidates = [
      (anyReport?.datosPrecargados?.mantenimiento || {})[campo],
      ((report as any)?.datosPrecargados?.mantenimiento || {})[campo],
      (odj?.datosPrecargados?.mantenimiento || {})[campo],
      (odj?.datos_precargados?.mantenimiento || {})[campo],
      (odj?.mantenimiento || {})[campo],
      // Intentar posibles rutas dentro del resultado del flujo si existen
      (rfj?.FlujoDecajaOperacion?.mantenimiento || {})[campo],
      (rfj?.FlujoDecajaOperacion?.costosMantenimiento || {})[campo],
    ];

    for (const v of candidates) {
      if (v !== undefined && v !== null && !Number.isNaN(Number(v))) {
        return Number(v);
      }
    }
    return defaultValue;
  };

  // Helper para formatear números con separador de miles y control de decimales
  const formatNumber = (value: number | null | undefined, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value as number))
      return "—";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value as number);
  };

  const formatPercentage = (value: number) => {
    return `${formatNumber(value * 100, 2)}%`;
  };

  // Obtener datos del flujo desde resultadoFlujo o resultado_flujo_json
  const resultadoFlujo =
    (report as any)?.resultadoFlujo ||
    (report as any)?.resultado_flujo_json ||
    (report as any)?.otros_datos_json?.resultado_flujo_json ||
    (report as any)?.otrosDatos?.resultado_flujo_json ||
    (report as any)?.otros_datos_json?.resultadoFlujo ||
    (report as any)?.otrosDatos?.resultadoFlujo;
  const flujoOperacion = resultadoFlujo?.FlujoDecajaOperacion;
  const flujoInversion = flujoOperacion?.flujoCajaInversion;
  const flujoFinanciamiento = flujoOperacion?.flujoCajaFinanciamiento;
  const reporteFinal = flujoOperacion?.reporteFinalConsolidado;
  const estadoResultados = flujoOperacion?.estadoDeResultados;
  const analisisFinanciero = reporteFinal?.analisisFinanciero;

  const aniosOperativos = flujoOperacion?.escenariosAnuales || [];
  const aniosMaximos = estadoResultados?.aniosMaximos || 6;

  return (
    <Dialog open={showReportModal} onOpenChange={onCloseModal}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Análisis de Flujo de Caja - {report.machine?.equipo || ""}{" "}
            {report.machine?.marca || ""} {report.machine?.modelo || ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la Máquina */}
          <div className="mb-4">
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
              Información de la Máquina
            </div>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 font-medium bg-muted/10 w-1/4">
                      Equipo
                    </td>
                    <td className="p-3">
                      {report.machine?.equipo ||
                        selectedMachine?.modelo?.equipo?.nombre ||
                        "—"}
                    </td>
                    <td className="p-3 font-medium bg-muted/10 w-1/4 border-l">
                      Marca
                    </td>
                    <td className="p-3">
                      {report.machine?.marca ||
                        selectedMachine?.modelo?.marca?.nombre ||
                        "—"}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium bg-muted/10">Modelo</td>
                    <td className="p-3">
                      {report.machine?.modelo ||
                        selectedMachine?.modelo?.nombre ||
                        "—"}
                    </td>
                    <td className="p-3 font-medium bg-muted/10 border-l">
                      Estado
                    </td>
                    <td className="p-3">calculado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Datos Precargados */}
          {getDatosPrecargados() && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
                Datos del Informe de Costo Horario
              </div>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium bg-muted/10">
                        Valor de Adquisición
                      </td>
                      <td className="p-3">
                        ${" "}
                        {formatNumber(
                          getDatosPrecargados()?.valorAdquisicion || 0,
                          0
                        )}
                      </td>
                      <td className="p-3 font-medium bg-muted/10 border-l">
                        Vida Útil (horas)
                      </td>
                      <td className="p-3">
                        {formatNumber(
                          getDatosPrecargados()?.vidaUtilFabricante || 0,
                          0
                        )}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium bg-muted/10">
                        Total Posesión + Mantenimiento
                      </td>
                      <td className="p-3">
                        ${" "}
                        {formatNumber(
                          getDatosPrecargados()?.totalPosesionMantenimiento || 0
                        )}
                      </td>
                      <td className="p-3 font-medium bg-muted/10 border-l">
                        Prima Seguro TREC
                      </td>
                      <td className="p-3">
                        ${" "}
                        {formatNumber(
                          getDatosPrecargados()?.primaSeguroTrec || 0
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium bg-muted/10">
                        Meses al Año
                      </td>
                      <td className="p-3">
                        {getDatosPrecargados()?.mesesAlAnio || 12}
                      </td>
                      <td className="p-3 font-medium bg-muted/10 border-l">
                        Escenarios
                      </td>
                      <td className="p-3">
                        {getDatosPrecargados()?.escenariosHoras?.length || 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parámetros Utilizados */}
          <div className="mb-4">
            <div className="border rounded-md overflow-hidden">
              {getParameter("comentario") && (
                <div className="border-t p-3 bg-muted/5">
                  <p className="text-xs text-muted-foreground mb-1">
                    Comentario
                  </p>
                  <p className="text-sm">{getParameter("comentario")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen Principal */}
          {flujoOperacion && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
                Resumen del Análisis
              </div>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b bg-muted/10">
                      <td className="p-2 font-semibold text-right">
                        Fecha Evaluación:
                      </td>
                      <td className="p-2">
                        {new Date().toLocaleDateString("es-PE")}
                      </td>
                      <td className="p-2 font-semibold text-right border-l">
                        Equipo:
                      </td>
                      <td className="p-2">
                        {selectedMachine?.modelo?.marca?.nombre}{" "}
                        {selectedMachine?.modelo?.nombre}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-right bg-muted/10">
                        % Residual
                      </td>
                      <td className="p-2">
                        {formatPercentage(
                          getParameter("porcentajeResidual", 0)
                        )}
                      </td>
                      <td className="p-2 font-semibold text-right bg-muted/10 border-l">
                        Valor del Activo
                      </td>
                      <td className="p-2">
                        $ {formatNumber(resultadoFlujo.valorAdquisicion, 0)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-right bg-muted/10">
                        Valor Residual
                      </td>
                      <td className="p-2">
                        $ {formatNumber(resultadoFlujo.valorResidual, 0)}
                      </td>
                      <td className="p-2 font-semibold text-right bg-muted/10 border-l">
                        Valor a Depreciar
                      </td>
                      <td className="p-2">
                        $ {formatNumber(resultadoFlujo.valorDepreciacion, 0)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-right bg-muted/10">
                        Vida Útil (horas)
                      </td>
                      <td className="p-2">
                        {formatNumber(resultadoFlujo.vidaUtilHoras, 0)}
                      </td>
                      <td className="p-2 font-semibold text-right bg-muted/10 border-l">
                        Margen Interno
                      </td>
                      <td className="p-2">
                        {formatPercentage(resultadoFlujo.margenInterno)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold text-right bg-muted/10">
                        Gastos Generales Mant.
                      </td>
                      <td className="p-2">
                        {formatPercentage(
                          getParameter("gastosGeneralesMantenimiento", 0)
                        )}
                      </td>
                      <td className="p-2 font-semibold text-right bg-muted/10 border-l">
                        Flota
                      </td>
                      <td className="p-2">1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Flujo de Caja de Operación - Tabla Completa */}
          {flujoOperacion && aniosOperativos.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
                Flujo de Caja de Operación
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="border p-2 text-left font-semibold w-[200px]">
                        EN $
                      </th>
                      <th className="border p-2 text-center font-semibold w-[100px]">
                        Año 0
                      </th>
                      {aniosOperativos.map((anio: any) => (
                        <th
                          key={anio.anio}
                          className="border p-2 text-center font-semibold"
                        >
                          Año {anio.anio}
                        </th>
                      ))}
                      <th className="border p-2 text-center font-semibold">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Horas operativas al mes */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 font-medium">
                        Horas operativos al mes
                      </td>
                      <td className="border border-gray-300 p-2 text-right bg-red-500 text-white font-bold">
                        {formatNumber(
                          aniosOperativos[0]?.horasOperativasMes || 0,
                          0
                        )}
                        /mes
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right"
                        >
                          {formatNumber(anio.horasOperativasMes || 0, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 font-bold">
                        {formatNumber(
                          aniosOperativos[0]?.horasOperativasMes || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Meses al año */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 font-medium">
                        Meses al año
                      </td>
                      <td className="border border-gray-300 p-2 text-right bg-green-500 text-white font-bold">
                        {formatNumber(
                          aniosOperativos[0]?.mesesDelAnio || 12,
                          2
                        )}{" "}
                        m
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right"
                        >
                          {formatNumber(anio.mesesDelAnio || 12, 2)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200">
                        -
                      </td>
                    </tr>

                    {/* Horas operativos al año */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 font-medium">
                        Horas operativos al año
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        hr
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right"
                        >
                          {formatNumber(anio.horasOperativasAnio, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 font-bold">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalHorasOperativasAnio ||
                            resultadoFlujo.vidaUtilHoras,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Cantidad de equipos */}
                    <tr className="bg-yellow-100">
                      <td className="border border-gray-300 p-2 font-medium">
                        Cantidad de equipos
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-yellow-400 font-bold">
                        1
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-center"
                        >
                          1
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-center bg-gray-200"></td>
                    </tr>

                    {/* Ingresos Totales */}
                    <tr className="bg-blue-50 font-bold">
                      <td className="border border-gray-300 p-2">
                        Ingresos Totales
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        -
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right text-green-700"
                        >
                          {formatNumber(anio.ingresosTotales, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 font-bold">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalIngresosTotales || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Tarifa interna por hora */}
                    <tr className="bg-green-100">
                      <td className="border border-gray-300 p-2 pl-8">
                        Tarifa interna por hora
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-500 text-white font-bold">
                        {formatNumber(flujoOperacion.tarifainternaporhora, 2)}
                        /hr
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right"
                        >
                          {formatNumber(anio.tarifainternaporhoraBase, 2)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-center bg-gray-200">
                        -
                      </td>
                    </tr>

                    {/* Egresos Totales */}
                    <tr className="bg-blue-50 font-bold">
                      <td className="border border-gray-300 p-2">
                        Egresos Totales
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-700 text-white font-bold">
                        {formatNumber(
                          flujoOperacion.totalPosesionMantenimientoBase,
                          2
                        )}
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right text-red-600"
                        >
                          {formatNumber(anio.egresosTotales, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 font-bold text-red-600">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalEgresosTotales || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Gasto por mantenimiento */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 pl-8">
                        Gasto por mantenimiento
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {formatNumber(
                          flujoOperacion.totalPosesionMantenimientoBase,
                          2
                        )}
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right bg-yellow-100 text-red-600"
                        >
                          {formatNumber(anio.gastospormantenimiento, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200">
                        {formatNumber(
                          Math.abs(
                            flujoOperacion.resumenFlujoCajaOperacion
                              ?.totalGastosMantenimiento || 0
                          ),
                          0
                        )}
                      </td>
                    </tr>

                    {/* Preventivo */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 pl-12">
                        Preventivo
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-500 text-white font-bold">
                        {formatNumber(
                          getMantenimientoUnitario("preventivo", 0),
                          2
                        )}
                        /hr
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right text-red-600"
                        >
                          {formatNumber(anio.preventivo, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalPreventivo || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Correctivo */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 pl-12">
                        Correctivo
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-500 text-white font-bold">
                        {formatNumber(
                          getMantenimientoUnitario("correctivo", 0),
                          2
                        )}
                        /hr
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right text-red-600"
                        >
                          {formatNumber(anio.correctivo, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalCorrectivo || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Neumáticos */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 pl-12">
                        Neumáticos
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-500 text-white font-bold">
                        {formatNumber(
                          getMantenimientoUnitario("neumaticos", 0),
                          2
                        )}
                        /hr
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right text-red-600"
                        >
                          {formatNumber(anio.neumaticos, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalNeumaticos || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Elementos de desgaste */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 pl-12">
                        Elementos de desgaste
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-500 text-white font-bold">
                        {formatNumber(
                          getMantenimientoUnitario("elementosDesgaste", 0),
                          2
                        )}
                        /hr
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right text-red-600"
                        >
                          {formatNumber(anio.elementosDesgaste, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalElementosDesgaste || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Soldadura */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 pl-12">
                        Soldadura
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-500 text-white font-bold">
                        {formatNumber(
                          getMantenimientoUnitario("soldadura", 0),
                          2
                        )}
                        /hr
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right text-red-600"
                        >
                          {formatNumber(anio.soldadura, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalSoldadura || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Mano de Obra / Supervisión */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 pl-12">
                        Mano de Obra / Supervisión
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-500 text-white font-bold">
                        {formatNumber(flujoOperacion.manoDeObraSupervision, 2)}
                        /hr
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right text-red-600"
                        >
                          {formatNumber(anio.manoDeObraSupervision, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalManoObraSupervision || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Gastos generales */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 pl-8">
                        Gastos generales
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-red-600 text-white font-bold">
                        {formatNumber(
                          flujoOperacion.gastosGeneralesdeMantenimiento,
                          2
                        )}
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right bg-yellow-100 text-red-600"
                        >
                          {formatNumber(anio.gastosgenerales, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalGastosGenerales || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* GGC / Otros */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 pl-12">
                        GGC / Otros
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-red-600 text-white font-bold">
                        {formatNumber(
                          flujoOperacion.gastosGeneralesdeMantenimiento,
                          2
                        )}
                        /hr
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right text-red-600"
                        >
                          {formatNumber(anio.gastosgenerales, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalGastosGenerales || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Seguro */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 pl-8">
                        Seguro
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {formatNumber(
                          aniosOperativos[0]?.seguro /
                            aniosOperativos[0]?.horasOperativasAnio || 0,
                          3
                        )}
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right bg-yellow-100"
                        >
                          {formatNumber(Math.abs(anio.seguro), 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200">
                        {formatNumber(
                          Math.abs(
                            flujoOperacion.resumenFlujoCajaOperacion
                              ?.totalSeguro || 0
                          ),
                          0
                        )}
                      </td>
                    </tr>

                    {/* Prima */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 pl-12">
                        Prima
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-green-500 text-white font-bold">
                        {formatNumber(
                          aniosOperativos[0]?.seguro /
                            aniosOperativos[0]?.horasOperativasAnio || 0,
                          3
                        )}
                        /hr
                      </td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border border-gray-300 p-2 text-right text-red-600"
                        >
                          {formatNumber(anio.seguro, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalSeguro || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Impuestos */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 pl-8">
                        Impuestos
                      </td>
                      <td className="border border-gray-300 p-2 text-center"></td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className={`border border-gray-300 p-2 text-right ${
                            (anio.impuestos || 0) < 0 ? "text-red-600" : ""
                          }`}
                        >
                          {formatNumber(anio.impuestos || 0, 0)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200">
                        {formatNumber(
                          Math.abs(
                            flujoOperacion.resumenFlujoCajaOperacion
                              ?.totalImpuestos || 0
                          ),
                          0
                        )}
                      </td>
                    </tr>

                    {/* Flujo de caja de Operación [A] */}
                    <tr className="bg-muted/20 font-bold text-sm">
                      <td className="border p-3">
                        Flujo de caja de Operación [A]
                      </td>
                      <td className="border p-3 text-center">-</td>
                      {aniosOperativos.map((anio: any) => (
                        <td
                          key={anio.anio}
                          className="border p-3 text-right font-bold"
                        >
                          {formatNumber(anio.flujo_de_caja_operacion, 0)}
                        </td>
                      ))}
                      <td className="border p-3 text-right bg-muted/30 font-bold">
                        {formatNumber(
                          flujoOperacion.resumenFlujoCajaOperacion
                            ?.totalFlujoCajaOperacion || 0,
                          0
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Flujo de Caja de Inversión */}
          {flujoInversion && flujoInversion.aniosOperativos && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
                Flujo de Caja de Inversión
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="border p-2 text-left font-semibold w-[200px]"></th>
                      <th className="border p-2 text-center font-semibold w-[100px]">
                        Año 0
                      </th>
                      {flujoInversion.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <th
                            key={idx}
                            className="border p-2 text-center font-semibold"
                          >
                            Año {anio.anio}
                          </th>
                        )
                      )}
                      <th className="border p-2 text-center font-semibold w-[120px]">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Capex */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 pl-4">Capex</td>
                      <td className="border border-gray-300 p-2 text-center">
                        -
                      </td>
                      {flujoInversion.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className="border border-gray-300 p-2 text-right text-red-600"
                          >
                            {anio.capex ? formatNumber(anio.capex, 0) : "-"}
                          </td>
                        )
                      )}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 font-bold text-red-600">
                        {formatNumber(
                          flujoInversion.resumen?.capexTotal || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Compra */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 pl-8">
                        Compra de 1 Cargador Frontal
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        -
                      </td>
                      {flujoInversion.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className="border border-gray-300 p-2 text-right text-red-600"
                          >
                            {anio.compra ? formatNumber(anio.compra, 0) : "-"}
                          </td>
                        )
                      )}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          -(resultadoFlujo?.valorAdquisicion || 0),
                          0
                        )}
                      </td>
                    </tr>

                    {/* Venta */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 pl-8">
                        Venta de 1 Cargador Frontal
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        -
                      </td>
                      {flujoInversion.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className="border border-gray-300 p-2 text-right text-green-600"
                          >
                            {anio.venta ? formatNumber(anio.venta, 0) : "-"}
                          </td>
                        )
                      )}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-green-600">
                        {formatNumber(
                          flujoInversion.resumen?.valorResidualRecuperado || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Flujo de caja de Inversión [B] */}
                    <tr className="bg-muted/20 font-bold text-sm">
                      <td className="border p-3">
                        Flujo de caja de Inversión [B]
                      </td>
                      <td className="border p-3 text-center">-</td>
                      {flujoInversion.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td key={idx} className="border p-3 text-right">
                            {formatNumber(anio.flujoInversion, 0)}
                          </td>
                        )
                      )}
                      <td className="border p-3 text-right bg-muted/10 font-bold">
                        {formatNumber(
                          flujoInversion.resumen?.flujoNetoInversion || 0,
                          0
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Flujo de Caja de Financiamiento */}
          {flujoFinanciamiento && flujoFinanciamiento.aniosOperativos && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
                Flujo de Caja de Financiamiento
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="border p-2 text-left font-semibold w-[200px]"></th>
                      <th className="border p-2 text-center font-semibold w-[100px]">
                        Año 0
                      </th>
                      {flujoFinanciamiento.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <th
                            key={idx}
                            className="border p-2 text-center font-semibold"
                          >
                            Año {anio.anio}
                          </th>
                        )
                      )}
                      <th className="border p-2 text-center font-semibold w-[120px]">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Capex */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2 pl-4">Capex</td>
                      <td className="border border-gray-300 p-2 text-center">
                        -
                      </td>
                      {flujoFinanciamiento.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className="border border-gray-300 p-2 text-right text-red-600"
                          >
                            {anio.capex ? formatNumber(anio.capex, 0) : "-"}
                          </td>
                        )
                      )}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 font-bold text-red-600">
                        {formatNumber(
                          flujoFinanciamiento.resumen?.totalCapex || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Intereses por financiamiento */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 pl-4">
                        Intereses por financiamiento
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        -
                      </td>
                      {flujoFinanciamiento.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className="border border-gray-300 p-2 text-right text-red-600"
                          >
                            {anio.interesesFinanciamiento
                              ? formatNumber(anio.interesesFinanciamiento, 0)
                              : "-"}
                          </td>
                        )
                      )}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 font-bold text-red-600">
                        {formatNumber(
                          flujoFinanciamiento.resumen
                            ?.totalInteresesFinanciamiento || 0,
                          0
                        )}
                        )
                      </td>
                    </tr>

                    {/* Flujo de caja de Financiamiento [C] */}
                    <tr className="bg-muted/20 font-bold text-sm">
                      <td className="border p-3">
                        Flujo de caja de Financiamiento [C]
                      </td>
                      <td className="border p-3 text-center">-</td>
                      {flujoFinanciamiento.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td key={idx} className="border p-3 text-right">
                            {formatNumber(anio.flujoFinanciamiento, 0)}
                          </td>
                        )
                      )}
                      <td className="border p-3 text-right bg-muted/10 font-bold">
                        {formatNumber(
                          flujoFinanciamiento.resumen
                            ?.totalFlujoFinanciamiento || 0,
                          0
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Flujo Resultante */}
          {reporteFinal && reporteFinal.aniosOperativos && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
                Flujo Resultante
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="border p-2 text-left font-semibold w-[200px]"></th>
                      <th className="border p-2 text-center font-semibold w-[100px]">
                        Año 0
                      </th>
                      {reporteFinal.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <th
                            key={idx}
                            className="border p-2 text-center font-semibold"
                          >
                            Año {anio.anio}
                          </th>
                        )
                      )}
                      <th className="border p-2 text-center font-semibold w-[120px]">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Flujo de Operación */}
                    <tr className="bg-white">
                      <td className="border p-2 font-semibold">
                        FLUJO DE CAJA DE OPERACIÓN [A]
                      </td>
                      <td className="border p-2 text-center">-</td>
                      {reporteFinal.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td key={idx} className="border p-2 text-right">
                            {formatNumber(anio.flujoOperacion, 0)}
                          </td>
                        )
                      )}
                      <td className="border p-2 text-right bg-muted/10">-</td>
                    </tr>

                    {/* Flujo de Inversión */}
                    <tr className="bg-gray-50">
                      <td className="border p-2 font-semibold">
                        FLUJO DE CAJA DE INVERSIÓN [B]
                      </td>
                      <td className="border p-2 text-center">-</td>
                      {reporteFinal.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td key={idx} className="border p-2 text-right">
                            {formatNumber(anio.flujoInversion, 0)}
                          </td>
                        )
                      )}
                      <td className="border p-2 text-right bg-muted/10">
                        {formatNumber(
                          reporteFinal.resumen?.totalFlujoInversion || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Flujo de Financiamiento */}
                    <tr className="bg-white">
                      <td className="border p-2 font-semibold">
                        FLUJO DE CAJA DE FINANCIAMIENTO [C]
                      </td>
                      <td className="border p-2 text-center">-</td>
                      {reporteFinal.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td key={idx} className="border p-2 text-right">
                            {formatNumber(anio.flujoFinanciamiento, 0)}
                          </td>
                        )
                      )}
                      <td className="border p-2 text-right bg-muted/10">-</td>
                    </tr>

                    {/* Flujo Resultante */}
                    <tr className="bg-muted/20 font-bold text-sm">
                      <td className="border p-3">FLUJO DE CAJA RESULTANTE</td>
                      <td className="border p-3 text-center">-</td>
                      {reporteFinal.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className={`border p-3 text-right font-bold ${
                              anio.flujoResultante < 0 ? "text-red-600" : ""
                            }`}
                          >
                            {formatNumber(anio.flujoResultante, 0)}
                          </td>
                        )
                      )}
                      <td
                        className={`border p-3 text-right bg-muted/30 font-bold ${
                          (reporteFinal.resumen?.totalFlujoResultante || 0) < 0
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {formatNumber(
                          reporteFinal.resumen?.totalFlujoResultante || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Flujo Resultante Acumulado */}
                    <tr className="bg-muted/30 font-bold text-sm">
                      <td className="border p-3">
                        FLUJO DE CAJA RESULTANTE ACUMULADO
                      </td>
                      <td className="border p-3 text-center">-</td>
                      {reporteFinal.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className={`border p-3 text-right font-bold ${
                              anio.flujoResultanteAcumulado < 0
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            {formatNumber(anio.flujoResultanteAcumulado, 0)}
                          </td>
                        )
                      )}
                      <td className="border p-3 text-right bg-muted/30">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Estado de Resultados */}
          {estadoResultados && estadoResultados.aniosOperativos && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
                Estado de Resultados
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="border p-2 text-left font-semibold w-[200px]"></th>
                      <th className="border p-2 text-center font-semibold w-[100px]">
                        Año 0
                      </th>
                      {estadoResultados.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <th
                            key={idx}
                            className="border p-2 text-center font-semibold"
                          >
                            Año {anio.anio}
                          </th>
                        )
                      )}
                      <th className="border p-2 text-center font-semibold w-[120px]">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Depreciación */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2">
                        (-) DEPRECIACIÓN
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        -
                      </td>
                      {estadoResultados.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className="border border-gray-300 p-2 text-right text-red-600"
                          >
                            {anio.depreciacion
                              ? formatNumber(anio.depreciacion, 0)
                              : "-"}
                          </td>
                        )
                      )}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200">
                        -
                      </td>
                    </tr>

                    {/* Enajenación */}
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        (-) ENAJENACIÓN
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        -
                      </td>
                      {estadoResultados.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className="border border-gray-300 p-2 text-right text-red-600"
                          >
                            {anio.enajenacion
                              ? formatNumber(anio.enajenacion, 0)
                              : "-"}
                          </td>
                        )
                      )}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-red-600">
                        {formatNumber(
                          estadoResultados.resumen?.totalEnajenacion || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Venta */}
                    <tr className="bg-white">
                      <td className="border border-gray-300 p-2">(+) VENTA</td>
                      <td className="border border-gray-300 p-2 text-center">
                        -
                      </td>
                      {estadoResultados.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className="border border-gray-300 p-2 text-right text-green-600"
                          >
                            {anio.venta ? formatNumber(anio.venta, 0) : "-"}
                          </td>
                        )
                      )}
                      <td className="border border-gray-300 p-2 text-right bg-gray-200 text-green-600">
                        {formatNumber(
                          estadoResultados.resumen?.totalVenta || 0,
                          0
                        )}
                      </td>
                    </tr>

                    {/* Estado de Resultados */}
                    <tr className="bg-muted/20 font-bold text-sm">
                      <td className="border p-3">ESTADO DE RESULTADOS</td>
                      <td className="border p-3 text-center">-</td>
                      {estadoResultados.aniosOperativos.map(
                        (anio: any, idx: number) => (
                          <td
                            key={idx}
                            className="border p-3 text-right font-bold"
                          >
                            {formatNumber(anio.estadoResultados || 0, 0)}
                          </td>
                        )
                      )}
                      <td className="border p-3 text-right bg-muted/30 font-bold">
                        {formatNumber(
                          estadoResultados.resumen?.totalEstadoResultados || 0,
                          0
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Indicadores Financieros */}
          {analisisFinanciero && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
                Indicadores Financieros del Proyecto
              </div>
              <div className="p-6 border rounded-md">
                {/* Tabla de Indicadores */}
                <table className="w-full border-collapse text-sm mb-6">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-semibold bg-muted/10">
                        Tasa de Descuento Empresa
                      </td>
                      <td className="p-3">
                        {formatPercentage(
                          getParameter("tasaDescuentoEmpresa", 0) ||
                            (report as any)?.tasa_descuento_empresa ||
                            (report as any)?.resultado_flujo_json
                              ?.tasa_descuento_empresa ||
                            (report as any)?.otros_datos_json
                              ?.tasa_descuento_empresa ||
                            0
                        )}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-semibold bg-muted/10">
                        VAN (
                        {(resultadoFlujo as any)?.aniosOperacionEstimados || 6}{" "}
                        años)
                      </td>
                      <td className="p-3 font-bold">
                        $ {formatNumber(analisisFinanciero.van?.valor || 0, 2)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-semibold bg-muted/10">TIR</td>
                      <td className="p-3 font-bold">
                        {formatNumber(analisisFinanciero.tir?.valor || 0, 2)}%
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-semibold bg-muted/10">ROI</td>
                      <td className="p-3 font-bold">
                        {formatNumber(analisisFinanciero.roi?.valor || 0, 2)}%
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-semibold bg-muted/10">PAYBACK</td>
                      <td className="p-3 font-bold">
                        {formatNumber(
                          analisisFinanciero.payback?.valor || 0,
                          2
                        )}{" "}
                        años
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold bg-muted/10">
                        RATIO B/C
                      </td>
                      <td className="p-3 font-bold">
                        {formatNumber(
                          analisisFinanciero.ratioBeneficioCosto?.valor || 0,
                          3
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Interpretaciones */}
                {analisisFinanciero.conclusion && (
                  <div className="mt-6 p-4 border rounded-md bg-muted/10">
                    <h4 className="font-semibold text-sm mb-3 uppercase text-muted-foreground">
                      Interpretación de Resultados
                    </h4>
                    <div className="space-y-2 text-sm">
                      {analisisFinanciero.van?.interpretacion && (
                        <p>
                          <span className="font-semibold">VAN:</span>{" "}
                          {analisisFinanciero.van.interpretacion}
                        </p>
                      )}
                      {analisisFinanciero.tir?.interpretacion && (
                        <p>
                          <span className="font-semibold">TIR:</span>{" "}
                          {analisisFinanciero.tir.interpretacion}
                        </p>
                      )}
                      {analisisFinanciero.roi?.interpretacion && (
                        <p>
                          <span className="font-semibold">ROI:</span>{" "}
                          {analisisFinanciero.roi.interpretacion}
                        </p>
                      )}
                      {analisisFinanciero.payback?.interpretacion && (
                        <p>
                          <span className="font-semibold">PAYBACK:</span>{" "}
                          {analisisFinanciero.payback.interpretacion}
                        </p>
                      )}
                      {analisisFinanciero.ratioBeneficioCosto
                        ?.interpretacion && (
                        <p>
                          <span className="font-semibold">RATIO B/C:</span>{" "}
                          {
                            analisisFinanciero.ratioBeneficioCosto
                              .interpretacion
                          }
                        </p>
                      )}
                    </div>
                    {analisisFinanciero.conclusion.recomendacion && (
                      <div className="mt-4 p-3 border rounded bg-background">
                        <p className="font-semibold">
                          {analisisFinanciero.conclusion.recomendacion}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información adicional */}
          {getDatosPrecargados()?.informeOrigen && (
            <div className="mb-4">
              <div className="p-4 border rounded-md bg-muted/10">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-semibold">Nota:</span> Este análisis
                    se basa en los datos del último informe de costo horario
                    calculado el{" "}
                    {getDatosPrecargados()?.informeOrigen?.fechaCalculo
                      ? new Date(
                          getDatosPrecargados()?.informeOrigen?.fechaCalculo
                        ).toLocaleDateString()
                      : "fecha no disponible"}
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
