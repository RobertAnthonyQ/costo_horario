import { HourlyCostReportResponse } from "../models/types";

// Helper para formatear números con separador de miles y control de decimales
// Usa locale en-US para comas como separador de miles (12,345.67)
// Si se requiere luego un locale configurable se puede extraer a util.
const formatNumber = (
  value: number | null | undefined,
  opts: Intl.NumberFormatOptions = {}
) => {
  if (value === null || value === undefined || isNaN(value as number))
    return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(value as number);
};

interface LargeReportTableProps {
  report: HourlyCostReportResponse;
}

export function LargeReportTable({ report }: LargeReportTableProps) {
  // Unificar forma de datos: puede venir anidado en resultado_completo_json (guardado)
  // o plano (preview). Preferimos el anidado si existe.
  const data: any = report.resultado_completo_json || (report as any);

  const escenarios = [...(data?.escenarios || [])].sort(
    (a, b) => (a.horasMinimas || 0) - (b.horasMinimas || 0)
  );

  const renderSection = (
    title: string,
    rows: {
      label: string;
      get: (esc: any) => number | string | undefined | null;
    }[]
  ) => (
    <div className="mb-6">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border rounded-md overflow-hidden">
          <thead>
            <tr className="bg-muted/30">
              <th className="text-left p-3 w-1/3">Métrica</th>
              {escenarios.map((e) => (
                <th key={e.horasMinimas} className="text-left p-3">
                  {new Intl.NumberFormat("en-US").format(e.horasMinimas)} hrs
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t">
                <td className="p-3 font-medium">{r.label}</td>
                {escenarios.map((e) => {
                  const v = r.get(e);
                  const isNumber =
                    typeof v === "number" && isFinite(v as number);
                  const display = isNumber
                    ? formatNumber(v as number)
                    : v === 0
                      ? formatNumber(0)
                      : (v ?? "—");
                  return (
                    <td key={`${r.label}-${e.horasMinimas}`} className="p-3">
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Función para tabla de valores únicos (no por escenario)
  const renderSingleTable = (title: string, data: any) => (
    <div className="mb-6">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border rounded-md overflow-hidden">
          <thead>
            <tr className="bg-muted/30">
              <th className="text-left p-3 w-1/2">Campo</th>
              <th className="text-left p-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data || {}).map(([key, value]) => (
              <tr key={key} className="border-t">
                <td className="p-3 font-medium">{key}</td>
                <td className="p-3">
                  {typeof value === "number"
                    ? isFinite(value)
                      ? // Para campos únicos uso 4 decimales a veces (mantengo lógica) pero con separador
                        formatNumber(value, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })
                      : String(value)
                    : typeof value === "boolean"
                      ? value
                        ? "Sí"
                        : "No"
                      : String(value ?? "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 1.1 - Descripción (seccion1.descripcion) - Datos únicos del equipo
  const descripcionEquipo =
    escenarios.length > 0 ? escenarios[0].seccion1?.descripcion : {};
  const seccion1Descripcion = renderSingleTable("1.1 - Descripción", {
    Item: descripcionEquipo?.item,
    Equipo: descripcionEquipo?.equipo,
    Marca: descripcionEquipo?.marca,
    Modelo: descripcionEquipo?.modelo,
    Estado: descripcionEquipo?.estado,
    "ID Equipo": descripcionEquipo?.idEquipo,
    "Horómetro Inicial": descripcionEquipo?.horometroInicial,
  });

  // 1.2 - Operación (seccion1.operacion)
  const seccion1Operacion = renderSection("1.2 - Operación", [
    {
      label: "1.2.1. Horas Mínimas",
      get: (e) => e.seccion1?.operacion?.horasMinimas,
    },
    {
      label: "1.2.2. Horas Uso Anual",
      get: (e) => e.seccion1?.operacion?.horasUsoAnual,
    },
    {
      label: "1.2.3. Política Depreciación (años)",
      get: (e) => e.seccion1?.operacion?.politicaDepreciacionAnos,
    },
  ]);

  // 2.1 - Descripción (seccion2.descripcion)
  const seccion2Descripcion = renderSection("2.1 - Descripción", [
    {
      label: "2.1.1. Valor Similar Nuevo",
      get: (e) => e.seccion2?.descripcion?.valorSimilarNuevo,
    },
    {
      label: "2.1.2. Valor Residual 10%",
      get: (e) => e.seccion2?.descripcion?.valorResidual10,
    },
    {
      label: "2.1.3. Vida Útil Fabricante",
      get: (e) => e.seccion2?.descripcion?.vidaUtilFabricante,
    },
    {
      label: "2.1.4. Depreciación Teórica",
      get: (e) => e.seccion2?.descripcion?.depreciacionTeorica,
    },
    {
      label: "2.1.5. Grado Operatividad",
      get: (e) => e.seccion2?.descripcion?.gradoOperatividad,
    },
    {
      label: "2.1.6. Valor Comercial Teórico",
      get: (e) => e.seccion2?.descripcion?.valorComercialTeorico,
    },
    {
      label: "2.1.7. Factor Mercado",
      get: (e) => e.seccion2?.descripcion?.factorMercado,
    },
    {
      label: "2.1.8. Valor Comercial Real",
      get: (e) => e.seccion2?.descripcion?.valorComercialReal,
    },
    {
      label: "2.1.9. % Valor Comercial Real",
      get: (e) => e.seccion2?.descripcion?.porcentajeValorComercialReal,
    },
    {
      label: "2.1.10. Depreciación Real",
      get: (e) => e.seccion2?.descripcion?.depreciacionReal,
    },
    {
      label: "2.1.11. Mes por Año",
      get: (e) => e.seccion2?.descripcion?.mesPorAnio,
    },
    {
      label: "2.1.12. Años Financiamiento",
      get: (e) => e.seccion2?.descripcion?.aniosFinanciamiento,
    },
    {
      label: "2.1.13. Tasa Financiamiento",
      get: (e) => e.seccion2?.descripcion?.tasaFinanciamiento,
    },
    {
      label: "2.1.14. Años Seguro",
      get: (e) => e.seccion2?.descripcion?.aniosSeguro,
    },
    {
      label: "2.1.15. Tasa Seguro",
      get: (e) => e.seccion2?.descripcion?.tasaSeguro,
    },
  ]);

  // 2.2 - Ratios USD/hr (seccion2.ratiosUsdHr) - Con numeración estructurada
  const seccion2Ratios = renderSection("2.2 - Ratios USD/hr", [
    {
      label: "2.2.1. Costo M.Prev - Lubricantes",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMPrevLubricantes,
    },
    {
      label: "2.2.2. Costo M.Prev - Filtros",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMPrevFiltros,
    },
    {
      label: "2.2.3. Costo M.Prev - Materiales de ferretería",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMPrevMaterialesFerreteria,
    },
    {
      label: "2.2.4. Costo M.Corr - Materiales eléctricos",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMCorrMaterialesElectricos,
    },
    {
      label: "2.2.5. Costo M.Corr - Mangueras",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMCorrMangueras,
    },
    {
      label: "2.2.6. Costo M.Corr - Menores",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMCorrMenores,
    },
    {
      label: "2.2.7. Costo M.Corr - Mayores",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMCorrMayores,
    },
    {
      label: "Ppto PICs",
      get: (e) => e.seccion2?.ratiosUsdHr?.pptoPics,
    },
    {
      label: "Incidencia (PIC/Valor Nuevo)",
      get: (e) => e.seccion2?.ratiosUsdHr?.incidenciaPicSobreValorNuevo,
    },
    {
      label: "Motor",
      get: (e) => e.seccion2?.ratiosUsdHr?.motor,
    },
    {
      label: "Transmisión",
      get: (e) => e.seccion2?.ratiosUsdHr?.transmision,
    },
    {
      label: "Convertidor",
      get: (e) => e.seccion2?.ratiosUsdHr?.convertidor,
    },
    {
      label: "Mandos Finales",
      get: (e) => e.seccion2?.ratiosUsdHr?.mandosFinales,
    },
    {
      label: "Diferenciales",
      get: (e) => e.seccion2?.ratiosUsdHr?.diferenciales,
    },
    {
      label: "Sistema Hidráulico",
      get: (e) => e.seccion2?.ratiosUsdHr?.sistemaHidraulico,
    },
    {
      label: "Sistema Eléctrico",
      get: (e) => e.seccion2?.ratiosUsdHr?.sistemaElectrico,
    },

    {
      label: "2.2.8. Costo Mantenimiento - Neumáticos",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMantenimientoNeumaticos,
    },
    {
      label: "2.2.9. Costo Mantenimiento - Soldadura/Estructuras",
      get: (e) =>
        e.seccion2?.ratiosUsdHr?.costoMantenimientoSoldaduraEstructuras,
    },
    {
      label: "2.2.10. Costo Mantenimiento - Elementos de desgaste (GETs)",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMantenimientoGets,
    },
  ]);

  // 3 - Costos fijos (seccion3.posesion)
  const seccion3Fijos = renderSection("3 - Costos horario fijos", [
    {
      label: "3.1. Depreciación",
      get: (e) => e.seccion3?.posesion?.depreciacion,
    },
    {
      label: "3.2. Financiamiento",
      get: (e) => e.seccion3?.posesion?.financiamiento,
    },
    { label: "3.3. Seguro TREC", get: (e) => e.seccion3?.posesion?.seguroTrec },
    {
      label: "3.4. Subtotal Fijos",
      get: (e) =>
        e.seccion3?.posesion?.subtotalFijos ?? e.seccion3?.posesion?.subtotal,
    },
    { label: "3.5. Utilidad", get: (e) => e.seccion3?.posesion?.utilidad },
    {
      label: "3.6. Total Costo Posesión",
      get: (e) => e.seccion3?.posesion?.totalCostoFijo,
    },
  ]);

  // 4 - Costos variables (seccion4)
  const seccion4Variables = renderSection("4 - Costos horario variables", [
    {
      label: "4.1. Mantenimiento Preventivo",
      get: (e) => e.seccion4?.mantenimientoPreventivo,
    },
    {
      label: "4.1.1. Lubricantes",
      // Ahora referenciamos al ratio específico (2.2) en lugar de un campo inexistente en seccion4
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMPrevLubricantes,
    },
    {
      label: "4.1.2. Filtros",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMPrevFiltros,
    },
    {
      label: "4.1.3. Materiales de ferrería",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMPrevMaterialesFerreteria,
    },
    {
      label: "4.2. Mantenimiento Correctivo",
      get: (e) => e.seccion4?.mantenimientoCorrectivo,
    },
    {
      label: "4.2.1. Materiales eléctricos",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMCorrMaterialesElectricos,
    },
    {
      label: "4.2.2. Mangueras",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMCorrMangueras,
    },
    {
      label: "4.2.3. Menores",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMCorrMenores,
    },
    {
      label: "4.2.4. Mayores",
      get: (e) => e.seccion2?.ratiosUsdHr?.costoMCorrMayores,
    },
    { label: "4.3. Neumáticos", get: (e) => e.seccion4?.neumaticos },
    {
      label: "4.4. Gets",
      get: (e) => e.seccion4?.elementosDesgaste,
    },
    { label: "4.5 Mano de Obra técnica", get: (e) => e.seccion4?.manoDeObraTecnico },
    {
      label: "4.6. Subtotal de costo de mantenimiento",
      get: (e) => e.seccion4?.subtotalVariable,
    },
    { label: "4.7. Utilidad", get: (e) => e.seccion4?.utilidad },
    {
      label: "4.8. Total Costo de mantenimiento",
      get: (e) => e.seccion4?.totalCostoVariable,
    },
  ]);

  // 5 - Totales
  const seccion5Totales = renderSection("5 - Costo horario total", [
    {
      label: "5.1. Posesión + Mantenimiento",
      get: (e) => e.totales?.fijosMasVariables,
    },
    { label: "5.2. Total", get: (e) => e.totales?.total },
  ]);

  // Parámetros (datos únicos, no por escenario)
  const parametros = data?.parametros;
  const seccionParametros = renderSingleTable("Parámetros", parametros);

  // Ratios Meta
  const ratiosMeta = data?.ratiosMeta || [];
  const seccionRatiosMeta =
    ratiosMeta.length > 0 ? (
      <div className="mb-6">
        <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
          Ratios Meta
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border rounded-md overflow-hidden">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Categoría</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Fecha Efectiva</th>
              </tr>
            </thead>
            <tbody>
              {ratiosMeta.map((ratio: any) => (
                <tr key={ratio.id} className="border-t">
                  <td className="p-3">{ratio.id}</td>
                  <td className="p-3">{ratio.tipo}</td>
                  <td className="p-3">{ratio.categoria}</td>
                  <td className="p-3">{formatNumber(ratio.valor)}</td>
                  <td className="p-3">
                    {new Date(ratio.fecha_efectiva).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : null;

  // Componentes Meta
  const componentesMeta = data?.componentesMeta || [];
  const seccionComponentesMeta =
    componentesMeta.length > 0 ? (
      <div className="mb-6">
        <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
          Componentes Meta
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border rounded-md overflow-hidden">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Componente</th>
                <th className="text-left p-3">PCR</th>
                <th className="text-left p-3">Monto USD</th>
                <th className="text-left p-3">Distribución</th>
                <th className="text-left p-3">Monto Aplicado</th>
                <th className="text-left p-3">Fecha Efectiva</th>
              </tr>
            </thead>
            <tbody>
              {componentesMeta.map((comp: any) => (
                <tr key={comp.id} className="border-t">
                  <td className="p-3">{comp.id}</td>
                  <td className="p-3">{comp.componente}</td>
                  <td className="p-3">{formatNumber(comp.pcr)}</td>
                  <td className="p-3">${formatNumber(comp.monto_usd)}</td>
                  <td className="p-3">
                    {formatNumber(comp.distribucion, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="p-3">
                    ${formatNumber(comp.monto_aplicado_al_proyecto)}
                  </td>
                  <td className="p-3">
                    {new Date(comp.fecha_efectiva).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : null;

  return (
    <div>
      {seccion1Descripcion}
      {seccion1Operacion}
      {seccion2Descripcion}
      {seccion2Ratios}
      {seccion3Fijos}
      {seccion4Variables}
      {seccion5Totales}
      {seccionParametros}
      {seccionRatiosMeta}
      {seccionComponentesMeta}
    </div>
  );
}
