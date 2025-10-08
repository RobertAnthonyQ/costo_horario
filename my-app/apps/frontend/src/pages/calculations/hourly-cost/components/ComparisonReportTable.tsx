import { HourlyCostReportResponse } from "../models/types";

// Helper para formatear números con separador de miles y control de decimales
const formatNumber = (
  value: number | null | undefined,
  opts: Intl.NumberFormatOptions = {}
) => {
  if (value === null || value === undefined || isNaN(value as number))
    return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(value as number);
};

interface ComparisonReportTableProps {
  report1: HourlyCostReportResponse;
  report2: HourlyCostReportResponse;
}

export function ComparisonReportTable({
  report1,
  report2,
}: ComparisonReportTableProps) {
  // Unificar forma de datos para ambos reportes
  const data1: any = report1.resultado_completo_json || (report1 as any);
  const data2: any = report2.resultado_completo_json || (report2 as any);

  const escenarios1 = [...(data1?.escenarios || [])].sort(
    (a, b) => (a.horasMinimas || 0) - (b.horasMinimas || 0)
  );
  const escenarios2 = [...(data2?.escenarios || [])].sort(
    (a, b) => (a.horasMinimas || 0) - (b.horasMinimas || 0)
  );

  const renderComparisonSection = (
    title: string,
    rows: {
      label: string;
      get: (esc: any) => number | string | undefined | null;
    }[]
  ) => {
    // Obtener todos los escenarios únicos basados en horas mínimas
    const allHours = Array.from(
      new Set([
        ...escenarios1.map((e) => e.horasMinimas),
        ...escenarios2.map((e) => e.horasMinimas),
      ])
    ).sort((a, b) => (a || 0) - (b || 0));

    return (
      <div className="mb-6">
        <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
          {title}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border rounded-md overflow-hidden">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left p-3 font-semibold">Concepto</th>
                {allHours.map((hours) => (
                  <th key={hours} className="text-center p-2 font-semibold">
                    {hours}h
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t">
                  <td className="p-3 font-medium bg-muted/10">{row.label}</td>
                  {allHours.map((hours) => {
                    // Buscar valores para cada máquina en este escenario
                    const esc1 = escenarios1.find(
                      (e) => e.horasMinimas === hours
                    );
                    const esc2 = escenarios2.find(
                      (e) => e.horasMinimas === hours
                    );

                    const value1 = esc1 ? row.get(esc1) : null;
                    const value2 = esc2 ? row.get(esc2) : null;

                    const formatValue = (val: any) =>
                      typeof val === "number" ? formatNumber(val) : val || "-";

                    return (
                      <td key={hours} className="p-2 text-center text-sm">
                        <div className="space-y-1">
                          <div className="text-blue-700 font-medium">
                            {formatValue(value1)}
                          </div>
                          <div className="text-red-700 font-medium">
                            {formatValue(value2)}
                          </div>
                        </div>
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
  };

  // Función para tabla de valores únicos comparativa
  const renderComparisonSingleTable = (
    title: string,
    data1: any,
    data2: any
  ) => (
    <div className="mb-6">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border rounded-md overflow-hidden">
          <thead>
            <tr className="bg-muted/30">
              <th className="text-left p-3 font-semibold">Concepto</th>
              <th className="text-center p-3 font-semibold text-blue-700">
                Máquina 1
              </th>
              <th className="text-center p-3 font-semibold text-red-700">
                Máquina 2
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(data1 || {}).map((key, index) => (
              <tr key={index} className="border-t">
                <td className="p-3 font-medium bg-muted/10">{key}</td>
                <td className="p-3 text-center text-blue-700 bg-blue-50/50">
                  {typeof data1[key] === "number"
                    ? formatNumber(data1[key])
                    : data1[key] || "-"}
                </td>
                <td className="p-3 text-center text-red-700 bg-red-50/50">
                  {typeof data2[key] === "number"
                    ? formatNumber(data2[key])
                    : data2[key] || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Headers de ambas máquinas
  const machine1Info = report1.machine || data1.machine;
  const machine2Info = report2.machine || data2.machine;

  // 1.1 - Descripción comparativa
  const descripcionEquipo1 =
    escenarios1.length > 0 ? escenarios1[0].seccion1?.descripcion : {};
  const descripcionEquipo2 =
    escenarios2.length > 0 ? escenarios2[0].seccion1?.descripcion : {};

  const seccion1Descripcion = renderComparisonSingleTable(
    "1.1 - Descripción",
    {
      Item: descripcionEquipo1?.item,
      Equipo: descripcionEquipo1?.equipo,
      Marca: descripcionEquipo1?.marca,
      Modelo: descripcionEquipo1?.modelo,
      Estado: descripcionEquipo1?.estado,
      "ID Equipo": descripcionEquipo1?.idEquipo,
      "Horómetro Inicial": descripcionEquipo1?.horometroInicial,
    },
    {
      Item: descripcionEquipo2?.item,
      Equipo: descripcionEquipo2?.equipo,
      Marca: descripcionEquipo2?.marca,
      Modelo: descripcionEquipo2?.modelo,
      Estado: descripcionEquipo2?.estado,
      "ID Equipo": descripcionEquipo2?.idEquipo,
      "Horómetro Inicial": descripcionEquipo2?.horometroInicial,
    }
  );

  // 1.2 - Operación comparativa
  const seccion1Operacion = renderComparisonSection("1.2 - Operación", [
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

  // 2.1 - Descripción comparativa
  const seccion2Descripcion = renderComparisonSection("2.1 - Descripción", [
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

  // 2.2 - Ratios USD/hr comparativa
  // Obtener componentes dinámicos de ambas máquinas
  const componentesDinamicos1 =
    escenarios1.length > 0
      ? escenarios1[0]?.seccion2?.ratiosUsdHr?.componentes || []
      : [];
  const componentesDinamicos2 =
    escenarios2.length > 0
      ? escenarios2[0]?.seccion2?.ratiosUsdHr?.componentes || []
      : [];

  // Crear un mapa único de todos los componentes por ID
  const allComponentsMap = new Map();
  componentesDinamicos1.forEach((comp: any) => {
    allComponentsMap.set(comp.componente_id, {
      id: comp.componente_id,
      nombre: comp.componente_nombre,
    });
  });
  componentesDinamicos2.forEach((comp: any) => {
    if (!allComponentsMap.has(comp.componente_id)) {
      allComponentsMap.set(comp.componente_id, {
        id: comp.componente_id,
        nombre: comp.componente_nombre,
      });
    }
  });
  const allComponentes = Array.from(allComponentsMap.values());

  // Construir las filas de ratios con componentes dinámicos integrados
  const ratiosComparisonRows = [
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
    // Agregar componentes dinámicos aquí
    ...allComponentes.map((comp) => ({
      label: `  → ${comp.nombre || `Componente ${comp.id}`}`,
      get: (e) => {
        const escComponentes = e.seccion2?.ratiosUsdHr?.componentes || [];
        const escComp = escComponentes.find(
          (c: any) => c.componente_id === comp.id
        );
        return escComp?.costo_pic_calculado;
      },
    })),
    {
      label: "Incidencia (PIC/Valor Nuevo)",
      get: (e) => e.seccion2?.ratiosUsdHr?.incidenciaPicSobreValorNuevo,
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
  ];

  const seccion2Ratios = renderComparisonSection(
    "2.2 - Ratios USD/hr",
    ratiosComparisonRows
  );

  // 3 - Costos fijos comparativos
  const seccion3Fijos = renderComparisonSection("3 - Costos horario fijos", [
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

  // 4 - Costos variables comparativos
  const seccion4Variables = renderComparisonSection(
    "4 - Costos horario variables",
    [
      {
        label: "4.1. Mantenimiento Preventivo",
        get: (e) => e.seccion4?.mantenimientoPreventivo,
      },
      {
        label: "4.1.1. Lubricantes",
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
      {
        label: "4.5 Mano de Obra técnica",
        get: (e) => e.seccion4?.manoDeObraTecnico,
      },
      {
        label: "4.6. Subtotal de costo de mantenimiento",
        get: (e) => e.seccion4?.subtotalVariable,
      },
      { label: "4.7. Utilidad", get: (e) => e.seccion4?.utilidad },
      {
        label: "4.8. Total Costo de mantenimiento",
        get: (e) => e.seccion4?.totalCostoVariable,
      },
    ]
  );

  // 5 - Totales comparativos
  const seccion5Totales = renderComparisonSection("5 - Costo horario total", [
    {
      label: "5.1. Posesión + Mantenimiento",
      get: (e) => e.totales?.fijosMasVariables,
    },
    { label: "5.2. Total", get: (e) => e.totales?.total },
  ]);

  return (
    <div className="space-y-6">
      {/* Header comparativo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
          <h3 className="font-semibold text-blue-700 mb-2">🔵 Máquina 1</h3>
          <div className="text-sm">
            <div className="font-medium">
              {machine1Info?.id_equipo_interno || `Máquina ${machine1Info?.id}`}
            </div>
            <div className="text-muted-foreground">
              {machine1Info?.modelo?.marca?.nombre} •{" "}
              {machine1Info?.modelo?.nombre}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Fecha:{" "}
              {report1.fecha_calculo
                ? new Date(report1.fecha_calculo).toLocaleString("es-ES")
                : "Cálculo actual"}
            </div>
          </div>
        </div>

        <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50/30">
          <h3 className="font-semibold text-red-700 mb-2">🔴 Máquina 2</h3>
          <div className="text-sm">
            <div className="font-medium">
              {machine2Info?.id_equipo_interno || `Máquina ${machine2Info?.id}`}
            </div>
            <div className="text-muted-foreground">
              {machine2Info?.modelo?.marca?.nombre} •{" "}
              {machine2Info?.modelo?.nombre}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Fecha:{" "}
              {report2.fecha_calculo
                ? new Date(report2.fecha_calculo).toLocaleString("es-ES")
                : "Cálculo actual"}
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda de colores */}
      <div className="bg-gray-50 p-3 rounded-lg text-sm mb-6">
        <div className="font-medium mb-2">Formato de tabla:</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Valor superior: Máquina 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span>Valor inferior: Máquina 2</span>
          </div>
        </div>
      </div>

      {/* Contenido comparativo */}
      {seccion1Descripcion}
      {seccion1Operacion}
      {seccion2Descripcion}
      {seccion2Ratios}
      {seccion3Fijos}
      {seccion4Variables}
      {seccion5Totales}

      {/* Parámetros comparativos */}
      {renderComparisonSingleTable(
        "Parámetros",
        data1?.parametros || {},
        data2?.parametros || {}
      )}

      {/* Ratios Meta comparativos */}
      {((data1?.ratiosMeta || []).length > 0 ||
        (data2?.ratiosMeta || []).length > 0) && (
        <div className="mb-6">
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
            Ratios Meta
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-blue-700 font-semibold mb-2">🔵 Máquina 1</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-blue-50/50">
                      <th className="text-left p-2 text-xs">ID</th>
                      <th className="text-left p-2 text-xs">Tipo</th>
                      <th className="text-left p-2 text-xs">Categoría</th>
                      <th className="text-left p-2 text-xs">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data1?.ratiosMeta || []).map((ratio: any) => (
                      <tr key={ratio.id} className="border-t">
                        <td className="p-2 text-xs">{ratio.id}</td>
                        <td className="p-2 text-xs">{ratio.tipo}</td>
                        <td className="p-2 text-xs">{ratio.categoria}</td>
                        <td className="p-2 text-xs">
                          {formatNumber(ratio.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="text-red-700 font-semibold mb-2">🔴 Máquina 2</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-red-50/50">
                      <th className="text-left p-2 text-xs">ID</th>
                      <th className="text-left p-2 text-xs">Tipo</th>
                      <th className="text-left p-2 text-xs">Categoría</th>
                      <th className="text-left p-2 text-xs">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data2?.ratiosMeta || []).map((ratio: any) => (
                      <tr key={ratio.id} className="border-t">
                        <td className="p-2 text-xs">{ratio.id}</td>
                        <td className="p-2 text-xs">{ratio.tipo}</td>
                        <td className="p-2 text-xs">{ratio.categoria}</td>
                        <td className="p-2 text-xs">
                          {formatNumber(ratio.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Componentes Meta comparativos */}
      {((data1?.componentesMeta || []).length > 0 ||
        (data2?.componentesMeta || []).length > 0) && (
        <div className="mb-6">
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
            Componentes Meta
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-blue-700 font-semibold mb-2">🔵 Máquina 1</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-blue-50/50">
                      <th className="text-left p-2 text-xs">ID</th>
                      <th className="text-left p-2 text-xs">Componente</th>
                      <th className="text-left p-2 text-xs">PCR</th>
                      <th className="text-left p-2 text-xs">Monto USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data1?.componentesMeta || []).map((comp: any) => (
                      <tr key={comp.id} className="border-t">
                        <td className="p-2 text-xs">{comp.id}</td>
                        <td className="p-2 text-xs">{comp.componente}</td>
                        <td className="p-2 text-xs">
                          {formatNumber(comp.pcr)}
                        </td>
                        <td className="p-2 text-xs">
                          ${formatNumber(comp.monto_usd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="text-red-700 font-semibold mb-2">🔴 Máquina 2</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-red-50/50">
                      <th className="text-left p-2 text-xs">ID</th>
                      <th className="text-left p-2 text-xs">Componente</th>
                      <th className="text-left p-2 text-xs">PCR</th>
                      <th className="text-left p-2 text-xs">Monto USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data2?.componentesMeta || []).map((comp: any) => (
                      <tr key={comp.id} className="border-t">
                        <td className="p-2 text-xs">{comp.id}</td>
                        <td className="p-2 text-xs">{comp.componente}</td>
                        <td className="p-2 text-xs">
                          {formatNumber(comp.pcr)}
                        </td>
                        <td className="p-2 text-xs">
                          ${formatNumber(comp.monto_usd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
