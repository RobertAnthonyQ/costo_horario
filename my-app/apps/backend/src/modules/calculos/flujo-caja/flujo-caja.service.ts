import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { InformeCostoHorarioService } from '../informe_costo_horario/informe-costo-horario.service';
import { CreateAnalisisFlujoDto } from './dto/create-analisis-flujo.dto';
import {
  FlujoCajaResponse,
  DatosPrecargadosInforme,
} from './interfaces/flujo-caja-response.interface';
import { serializeBigInt } from '../../../utils/bigint-serializer';

@Injectable()
export class FlujoCajaService {
  constructor(
    private prisma: PrismaService,
    private informeCostoHorarioService: InformeCostoHorarioService,
  ) {}

  /**
   * Calcula el VAN (Valor Actual Neto) manualmente
   * VAN = Σ[Flujo_t / (1 + tasa_descuento)^t] donde t va de 1 a n (SIN inversión inicial)
   * @param flujosCaja - Array de flujos de caja [flujo_año1, flujo_año2, ...] SIN inversión inicial
   * @param tasaDescuento - Tasa de descuento de la empresa (decimal, ej: 0.08 = 8%)
   * @returns VAN calculado
   */
  private calcularVAN(flujosCaja: number[], tasaDescuento: number): number {
    try {
      let van = 0;

      for (let i = 0; i < flujosCaja.length; i++) {
        const t = i + 1; // Los años empiezan desde 1 (no desde 0)
        const flujoActual = flujosCaja[i];
        const factorDescuento = Math.pow(1 + tasaDescuento, t);
        const valorPresente = flujoActual / factorDescuento;
        van += valorPresente;

        console.log(
          `[FLUJO-CAJA] VAN Año ${t}: Flujo=$${flujoActual.toLocaleString()}, Factor=${factorDescuento.toFixed(4)}, VP=$${valorPresente.toLocaleString()}`,
        );
      }

      return Number(van.toFixed(2));
    } catch (error) {
      console.error('[FLUJO-CAJA] Error calculando VAN:', error);
      return 0;
    }
  }

  /**
   * Calcula el TIR (Tasa Interna de Retorno) usando método de Newton-Raphson
   * TIR es la tasa donde VAN = 0 (SIN inversión inicial)
   * @param flujosCaja - Array de flujos de caja [flujo_año1, flujo_año2, ...] SIN inversión inicial
   * @returns TIR calculado como porcentaje (ejemplo: 15.25 = 15.25%)
   */
  private calcularTIR(flujosCaja: number[]): number {
    try {
      // Validar que hay al menos un flujo anual
      if (flujosCaja.length < 1) {
        console.error('[FLUJO-CAJA] TIR: Se necesita al menos 1 flujo anual');
        return 0;
      }

      // Para flujos sin inversión inicial, el TIR es simplemente el rendimiento promedio
      // Sin embargo, mantenemos Newton-Raphson para consistencia con VAN
      let tasa = 0.1; // Estimación inicial del 10%
      const tolerancia = 0.000001; // Tolerancia para convergencia
      const maxIteraciones = 100;

      for (let iteracion = 0; iteracion < maxIteraciones; iteracion++) {
        let van = 0;
        let derivadaVan = 0;

        // Calcular VAN y su derivada para la tasa actual (años empiezan desde 1)
        for (let i = 0; i < flujosCaja.length; i++) {
          const t = i + 1; // Los años empiezan desde 1 (no desde 0)
          const flujo = flujosCaja[i];
          const denominador = Math.pow(1 + tasa, t);

          // VAN
          van += flujo / denominador;

          // Derivada del VAN respecto a la tasa
          derivadaVan -= (t * flujo) / Math.pow(1 + tasa, t + 1);
        }

        // Si VAN está cerca de cero, hemos encontrado la TIR
        if (Math.abs(van) < tolerancia) {
          const tirPorcentaje = tasa * 100;
          console.log(
            `[FLUJO-CAJA] TIR converge en iteración ${iteracion + 1}: ${tirPorcentaje.toFixed(2)}%`,
          );
          return Number(tirPorcentaje.toFixed(2));
        }

        // Si la derivada es cero, no podemos continuar
        if (Math.abs(derivadaVan) < tolerancia) {
          console.error(
            '[FLUJO-CAJA] TIR: Derivada muy pequeña, no se puede calcular',
          );
          return 0;
        }

        // Actualizar estimación usando Newton-Raphson: x_{n+1} = x_n - f(x_n)/f'(x_n)
        const nuevaTasa = tasa - van / derivadaVan;

        // Evitar tasas negativas extremas (mínimo -99%)
        tasa = Math.max(nuevaTasa, -0.99);

        // Log cada 10 iteraciones
        if (iteracion % 10 === 0) {
          console.log(
            `[FLUJO-CAJA] TIR Iteración ${iteracion}: Tasa=${(tasa * 100).toFixed(4)}%, VAN=$${van.toFixed(2)}`,
          );
        }
      }

      console.error(
        '[FLUJO-CAJA] TIR: No converge después de',
        maxIteraciones,
        'iteraciones',
      );
      return 0;
    } catch (error) {
      console.error('[FLUJO-CAJA] Error calculando TIR:', error);
      return 0;
    }
  }

  /**
   * Prepara los flujos de caja para cálculos de VAN y TIR
   * @param reporteFinalConsolidado - Reporte consolidado con flujos resultantes
   * @param valorAdquisicion - Valor de adquisición (NO SE USA - solo para compatibilidad)
   * @returns Array de flujos preparado [flujo_año1, flujo_año2, ...] SIN inversión inicial
   */
  private prepararFlujosCajaParaAnalisis(
    reporteFinalConsolidado: any,
    valorAdquisicion: number,
  ): number[] {
    // Extraer flujos resultantes de cada año - usar aniosOperativos en lugar de aniosReporte
    const flujosAnuales =
      reporteFinalConsolidado.aniosOperativos?.map(
        (anio: any) => anio.flujoResultante,
      ) || [];

    console.log(
      `[FLUJO-CAJA] Flujos anuales extraídos (${flujosAnuales.length} años):`,
      flujosAnuales,
    );
    console.log(
      `[FLUJO-CAJA] NO SE INCLUYE inversión inicial de $${valorAdquisicion.toLocaleString()} en cálculos VAN/TIR`,
    );

    // Construir array: [flujo_año1, flujo_año2, ...] - SIN inversión inicial
    return flujosAnuales;
  }

  /**
   * Obtiene el último informe de costo horario de una máquina
   */
  private async getUltimoInformeCostoHorario(machineId: number) {
    const historial =
      await this.informeCostoHorarioService.findHistorialByMachine(machineId);

    if (!historial || historial.length === 0) {
      throw new NotFoundException(
        `No se encontró ningún informe de costo horario para la máquina ${machineId}. ` +
          'Debe generar un informe de costo horario antes de hacer el análisis de flujo de caja.',
      );
    }

    // El más reciente está primero (ordenado por fecha desc)
    return historial[0];
  }

  /**
   * Preview - Precarga datos y realiza cálculo automáticamente
   */
  async preview(dto: CreateAnalisisFlujoDto): Promise<any> {
    console.log(`[FLUJO-CAJA] ========== PRECARGANDO DATOS ==========`);
    console.log(`[FLUJO-CAJA] Machine ID: ${dto.machineId}`);
    console.log(`[FLUJO-CAJA] Usando informe más reciente de la máquina`);

    // Obtener la máquina
    const machine = await this.prisma.machines.findUnique({
      where: { id: dto.machineId },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
          },
        },
      },
    });

    if (!machine) {
      throw new NotFoundException(
        `Máquina con ID ${dto.machineId} no encontrada`,
      );
    }

    console.log(
      `[FLUJO-CAJA] Máquina encontrada: ${machine.modelo?.marca?.nombre} ${machine.modelo?.nombre}`,
    );

    // Obtener informe de costo horario más reciente
    const informeCostoHorario = await this.getUltimoInformeCostoHorario(
      dto.machineId,
    );
    console.log(
      `[FLUJO-CAJA] Usando informe más reciente ID: ${informeCostoHorario.id}`,
    );

    console.log(
      `[FLUJO-CAJA] Fecha del informe: ${informeCostoHorario.fecha_calculo}`,
    );

    // Extraer datos del JSON del informe
    const informeData = informeCostoHorario.resultado_completo_json as any;

    if (!informeData) {
      throw new NotFoundException(
        `Informe de costo horario ${informeCostoHorario.id} no tiene datos de cálculo`,
      );
    }

    console.log(
      `[FLUJO-CAJA] Escenarios en informe: ${informeData.escenarios?.length || 0}`,
    );
    console.log(
      `[FLUJO-CAJA] Parámetros disponibles:`,
      Object.keys(informeData.parametros || {}),
    );

    // Extraer valor de adquisición
    const valorAdquisicion = Number(machine.valor_similar_nuevo) || 0;
    const vidaUtilFabricante = Number(machine.vida_util) || 0;
    const mesesAlAnio = informeData.parametros?.mesesPorAnio || 12;

    console.log(
      `[FLUJO-CAJA] Valor adquisición: $${valorAdquisicion.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Vida útil fabricante: ${vidaUtilFabricante} horas`,
    );
    console.log(`[FLUJO-CAJA] Meses al año: ${mesesAlAnio}`);

    // Extraer escenarios de horas desde el informe
    const escenariosHoras = (informeData.escenarios || []).map(
      (escenario: any, index: number) => {
        const horasMinimas = Number(escenario.horasMinimas || 0);
        const gradoOperatividad = Number(escenario.gradoOperatividad || 0);
        const factorMercado = Number(escenario.factorMercado || 0);
        const horasUsoAnual = Number(
          escenario.horasUsoAnual || horasMinimas * mesesAlAnio,
        );

        // Extraer seguro TREC de seccion3 y valor comercial real de seccion2
        const seccion3Escenario = escenario.seccion3?.posesion || {};
        const seccion2Escenario = escenario.seccion2?.descripcion || {};
        const seguroTrecEscenario = Number(seccion3Escenario.seguroTrec || 0);
        const valorComercialRealEscenario = Number(
          seccion2Escenario.valorComercialReal || 0,
        );

        console.log(
          `[FLUJO-CAJA] Escenario ${index + 1}: Hmin=${horasMinimas}, Grado=${gradoOperatividad}, Factor=${factorMercado}, HorasAnual=${horasUsoAnual}, SeguroTREC=${seguroTrecEscenario}, ValorComercialReal=${valorComercialRealEscenario}`,
        );

        return {
          horasMinimas,
          gradoOperatividad,
          factorMercado,
          horasUsoAnual,
          seguroTrec: seguroTrecEscenario,
          valorComercialReal: valorComercialRealEscenario,
        };
      },
    );

    // Extraer datos de mantenimiento desde el primer escenario (asumimos que son similares)
    const primerEscenario = informeData.escenarios?.[0];
    let mantenimiento = {
      preventivo: 0,
      correctivo: 0,
      neumaticos: 0,
      elementosDesgaste: 0,
      soldadura: 0,
      manoDeObraSupervision: 0,
    };

    let totalPosesionMantenimiento = 0;
    let primaSeguroTrec = 0;

    if (primerEscenario) {
      // Extraer desde sección 4 (mantenimiento)
      const seccion4 = primerEscenario.seccion4 || {};

      mantenimiento = {
        preventivo: Number(seccion4.mantenimientoPreventivo || 0),
        correctivo: Number(seccion4.mantenimientoCorrectivo || 0),
        neumaticos: Number(seccion4.neumaticos || 0),
        elementosDesgaste: Number(seccion4.elementosDesgaste || 0),
        soldadura: Number(seccion4.estructural || 0),
        manoDeObraSupervision: Number(seccion4.manoDeObraTecnico || 0),
      };

      console.log(`[FLUJO-CAJA] Mantenimiento extraído:`, mantenimiento);

      // Extraer desde sección 3 (posesión)
      const seccion3 = primerEscenario.seccion3?.posesion || {};
      const subtotalPosesion = Number(seccion3.subtotal || 0);
      const subtotalMantenimiento = Number(seccion4.subtotalVariable || 0);

      totalPosesionMantenimiento = Number(
        subtotalPosesion + subtotalMantenimiento,
      );
      primaSeguroTrec = Number(seccion3.seguroTrec || 0);

      console.log(`[FLUJO-CAJA] Subtotal posesión: $${subtotalPosesion}`);
      console.log(
        `[FLUJO-CAJA] Subtotal mantenimiento: $${subtotalMantenimiento}`,
      );
      console.log(
        `[FLUJO-CAJA] Total posesión + mantenimiento: $${totalPosesionMantenimiento}`,
      );
      console.log(`[FLUJO-CAJA] Prima/Seguro TREC: $${primaSeguroTrec}`);
    }

    // Construir datos precargados
    const datosPrecargados: DatosPrecargadosInforme = {
      valorAdquisicion: Number(valorAdquisicion),
      vidaUtilFabricante: Number(vidaUtilFabricante),
      mesesAlAnio: Number(mesesAlAnio),
      escenariosHoras,
      totalPosesionMantenimiento: Number(totalPosesionMantenimiento),
      mantenimiento: {
        preventivo: Number(mantenimiento.preventivo),
        correctivo: Number(mantenimiento.correctivo),
        neumaticos: Number(mantenimiento.neumaticos),
        elementosDesgaste: Number(mantenimiento.elementosDesgaste),
        soldadura: Number(mantenimiento.soldadura),
        manoDeObraSupervision: Number(mantenimiento.manoDeObraSupervision),
      },
      primaSeguroTrec: Number(primaSeguroTrec),
      informeOrigen: {
        id: Number(informeCostoHorario.id),
        fechaCalculo: informeCostoHorario.fecha_calculo,
        tasaFinanciamiento: Number(
          informeCostoHorario.tasa_financiamiento_usada || 0,
        ),
        aniosFinanciamiento: Number(
          informeCostoHorario.anios_financiamiento || 0,
        ),
        tasaSeguro: Number(informeCostoHorario.tasa_seguro_usada || 0),
        porcentajeUtilidad: Number(
          informeData.parametros?.porcentajeUtilidad || 0,
        ),
      },
    };

    // Calcular gastos generales de mantenimiento como porcentaje
    const porcentajeGastosGenerales = Number(
      dto.gastosGeneralesMantenimiento || 0.05,
    ); // 5% por defecto
    const gastosGeneralesCalculados = Number(
      porcentajeGastosGenerales * totalPosesionMantenimiento,
    );
    console.log(
      `[FLUJO-CAJA] Porcentaje gastos generales: ${(porcentajeGastosGenerales * 100).toFixed(1)}%`,
    );
    console.log(
      `[FLUJO-CAJA] Gastos generales calculados: $${gastosGeneralesCalculados.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] ========== DATOS PRECARGADOS COMPLETOS ==========`,
    );

    // Construir respuesta
    const response: FlujoCajaResponse = {
      machine: {
        id: Number(machine.id),
        item: Number(machine.id),
        equipo: machine.modelo?.equipo?.nombre || null,
        marca: machine.modelo?.marca?.nombre || null,
        modelo: machine.modelo?.nombre || null,
        estado: machine.estado,
        idEquipo: machine.id_equipo_interno
          ? Number(machine.id_equipo_interno)
          : null,
      },
      datosPrecargados,
      parametros: {
        // Valores por defecto que puede modificar el usuario
        porcentajeResidual: Number(dto.porcentajeResidual || 0.1), // 10% por defecto
        margenInterno: Number(dto.margenInterno || 0.05), // 5% por defecto
        gastosGeneralesMantenimiento: gastosGeneralesCalculados, // Valor calculado del porcentaje
        horasOperativasMes: Number(
          dto.horasOperativasMes || escenariosHoras[0]?.horasMinimas || 300,
        ),
        tasaDescuentoEmpresa: Number(dto.tasaDescuentoEmpresa || 0.08), // 8% por defecto
        usuarioId: undefined, // No disponible en el DTO actual
        fechaCalculo: new Date().toISOString(),
        comentario: dto.comentario,
      },
      estado: 'precargado',
    };

    console.log(
      `[FLUJO-CAJA] Respuesta construida con estado: ${response.estado}`,
    );

    // Hacer cálculo automáticamente usando los datos precargados
    // Cálculo adicional: años = vida útil (horas) / horasOperativasMes * 12
    const vidaUtilHoras = Number(datosPrecargados.vidaUtilFabricante || 0);
    const horasOperativasMes = Number(
      response.parametros.horasOperativasMes || 0,
    );
    const aniosOperacionEstimadosRaw =
      horasOperativasMes > 0 ? vidaUtilHoras / (horasOperativasMes * 12) : null;
    const aniosOperacionEstimados =
      aniosOperacionEstimadosRaw !== null &&
      isFinite(aniosOperacionEstimadosRaw)
        ? Number(aniosOperacionEstimadosRaw.toFixed(2))
        : null;

    // Calcular el número de años enteros para los escenarios (redondeado hacia arriba)
    const aniosParaEscenarios =
      aniosOperacionEstimados !== null ? Math.ceil(aniosOperacionEstimados) : 5; // 5 años por defecto si no se puede calcular

    const valorResidual =
      datosPrecargados.valorAdquisicion *
      response.parametros.porcentajeResidual;
    const valorDepreciacion = datosPrecargados.valorAdquisicion - valorResidual;

    // Calcular depreciación anual (negativo porque es egreso)
    const depreciacionAnual = (-1 * valorDepreciacion) / aniosParaEscenarios;

    // Tasa de impuestos (parametrizable - 29.5% por defecto)
    // TODO: Agregar tasaImpuestos al DTO CreateAnalisisFlujoDto para hacerlo completamente parametrizable
    const tasaImpuestos = 0.295;

    console.log(
      `[FLUJO-CAJA] Años de operación estimados (vida_util/horasMes*12): ${aniosOperacionEstimados}`,
    );
    console.log(
      `[FLUJO-CAJA] Años para escenarios (redondeado hacia arriba): ${aniosParaEscenarios}`,
    );
    console.log(
      `[FLUJO-CAJA] Depreciación anual: $${Math.abs(depreciacionAnual).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Tasa de impuestos: ${(tasaImpuestos * 100).toFixed(1)}%`,
    );
    const gastodemantenimiento =
      datosPrecargados.mantenimiento.preventivo +
      datosPrecargados.mantenimiento.correctivo +
      datosPrecargados.mantenimiento.neumaticos +
      datosPrecargados.mantenimiento.elementosDesgaste +
      datosPrecargados.mantenimiento.soldadura +
      datosPrecargados.mantenimiento.manoDeObraSupervision;
    const gastosgenerales =
      Number(dto.gastosGeneralesMantenimiento) *
      (datosPrecargados.mantenimiento.preventivo +
        datosPrecargados.mantenimiento.correctivo +
        datosPrecargados.mantenimiento.neumaticos +
        datosPrecargados.mantenimiento.elementosDesgaste);

    // Buscar el escenario que coincida con las horas operativas del mes
    const escenarioSeleccionado = datosPrecargados.escenariosHoras.find(
      (escenario) => escenario.horasMinimas === horasOperativasMes,
    );

    // Si encuentra el escenario, usar su seguroTrec y valorComercialReal, si no, usar el del primer escenario como fallback
    const seguroTrecSeleccionado = escenarioSeleccionado
      ? escenarioSeleccionado.seguroTrec
      : datosPrecargados.primaSeguroTrec;

    const valorComercialRealSeleccionado = escenarioSeleccionado
      ? (escenarioSeleccionado as any).valorComercialReal || 0
      : (datosPrecargados.escenariosHoras[0] as any)?.valorComercialReal || 0;

    // Buscar el totalPosesionMantenimiento del escenario seleccionado
    // Necesitamos extraer este valor del escenario específico, similar al seguroTrec
    let totalPosesionMantenimientoSeleccionado =
      datosPrecargados.totalPosesionMantenimiento;

    if (escenarioSeleccionado) {
      // Extraer el totalPosesionMantenimiento del escenario seleccionado del informe original
      const escenarioOriginal = informeData.escenarios?.find(
        (esc: any) => Number(esc.horasMinimas || 0) === horasOperativasMes,
      );

      if (escenarioOriginal) {
        const seccion3Escenario = escenarioOriginal.seccion3?.posesion || {};
        const seccion4Escenario = escenarioOriginal.seccion4 || {};
        const subtotalPosesionEscenario = Number(
          seccion3Escenario.subtotal || 0,
        );
        const subtotalMantenimientoEscenario = Number(
          seccion4Escenario.subtotalVariable || 0,
        );
        totalPosesionMantenimientoSeleccionado =
          subtotalPosesionEscenario + subtotalMantenimientoEscenario;
      }
    }

    const tarifainternaporhora =
      totalPosesionMantenimientoSeleccionado *
      (1 + response.parametros.margenInterno);

    console.log(
      `[FLUJO-CAJA] Horas operativas mes: ${horasOperativasMes}, Escenario encontrado: ${escenarioSeleccionado ? 'Sí' : 'No'}, Seguro TREC seleccionado: ${seguroTrecSeleccionado}`,
    );
    console.log(
      `[FLUJO-CAJA] Valor Comercial Real seleccionado: ${valorComercialRealSeleccionado}`,
    );
    console.log(
      `[FLUJO-CAJA] Total Posesión+Mantenimiento seleccionado: ${totalPosesionMantenimientoSeleccionado}`,
    );
    console.log(
      `[FLUJO-CAJA] parametros gastos generales mantenimiento: ${response.parametros.gastosGeneralesMantenimiento}`,
    );

    // Calcular tabla de amortización por años si hay financiamiento
    let tablaAmortizacionAnual: any = null;
    if (
      datosPrecargados.informeOrigen.tasaFinanciamiento > 0 &&
      datosPrecargados.informeOrigen.aniosFinanciamiento > 0
    ) {
      tablaAmortizacionAnual = this.calcularTablaAmortizacionAnual(
        datosPrecargados.valorAdquisicion,
        datosPrecargados.informeOrigen.tasaFinanciamiento,
        datosPrecargados.mesesAlAnio,
        datosPrecargados.informeOrigen.aniosFinanciamiento,
      );

      console.log(
        '[FLUJO-CAJA] ========== TABLA DE AMORTIZACIÓN ANUAL ==========',
      );
      if (tablaAmortizacionAnual) {
        tablaAmortizacionAnual.tablaAnual.forEach((anio, index) => {
          console.log(`[FLUJO-CAJA] Año ${index + 1}:`);
          console.log(`  - Capital: $${anio.capitalAnual.toLocaleString()}`);
          console.log(`  - Interés: $${anio.interesAnual.toLocaleString()}`);
          console.log(`  - Total Año: $${anio.totalAnual.toLocaleString()}`);
          console.log(
            `  - Saldo Pendiente: $${anio.saldoPendiente.toLocaleString()}`,
          );
        });
        console.log(`[FLUJO-CAJA] Resumen Total:`);
        console.log(
          `  - Capital Total: $${tablaAmortizacionAnual.resumen.capitalTotal.toLocaleString()}`,
        );
        console.log(
          `  - Interés Total: $${tablaAmortizacionAnual.resumen.interesTotal.toLocaleString()}`,
        );
        console.log(
          `  - Suma Total: $${tablaAmortizacionAnual.resumen.sumaTotal.toLocaleString()}`,
        );
      }
      console.log('[FLUJO-CAJA] =============================================');
    }

    // Función auxiliar para calcular meses del año (último año proporcional)
    const calcularMesesDelAnio = (anioActual: number): number => {
      const esUltimoAnio = anioActual === aniosParaEscenarios;
      const aniosValidos = aniosOperacionEstimados ?? 0;
      const parteDecimal = aniosValidos - Math.floor(aniosValidos);
      return esUltimoAnio && parteDecimal > 0
        ? parteDecimal * datosPrecargados.mesesAlAnio
        : datosPrecargados.mesesAlAnio;
    };

    const resultadoConCalculo = {
      ...response,
      estado: 'calculado',
      resultadoFlujo: {
        // Aquí puedes agregar la lógica de cálculo específica
        // Por ahora devolvemos la estructura básica
        calculoCompleto: true,
        fechaCalculo: new Date().toISOString(),
        valorAdquisicion: datosPrecargados.valorAdquisicion,
        valorResidual,
        valorDepreciacion,
        vidaUtilHoras,
        margenInterno: response.parametros.margenInterno,
        gastosGeneralesdeMantenimiento: Number(
          dto.gastosGeneralesMantenimiento,
        ), // 0.05 por defecto
        aniosOperacionEstimados,
        aniosParaEscenarios,
        // Incluir tabla de amortización
        FlujoDecajaOperacion: {
          horasOperativasMes,
          mesesAlAnio: datosPrecargados.mesesAlAnio,
          tarifainternaporhora: tarifainternaporhora, // Tarifa con margen interno basada en el escenario seleccionado
          totalPosesionMantenimientoBase:
            totalPosesionMantenimientoSeleccionado, // Valor base del escenario seleccionado
          preventivo: datosPrecargados.mantenimiento.preventivo,
          correctivo: datosPrecargados.mantenimiento.correctivo,
          neumaticos: datosPrecargados.mantenimiento.neumaticos,
          elementosDesgaste: datosPrecargados.mantenimiento.elementosDesgaste,
          soldadura: datosPrecargados.mantenimiento.soldadura,
          manoDeObraSupervision:
            datosPrecargados.mantenimiento.manoDeObraSupervision,
          gastosGeneralesdeMantenimiento: gastodemantenimiento,
          gastosgenerales: gastosgenerales,
          seguro: seguroTrecSeleccionado, // Seguro TREC del escenario seleccionado
          // Generar escenarios por años (solo años operativos, sin año 0)
          escenariosAnuales: Array.from(
            { length: aniosParaEscenarios },
            (_, index) => {
              const anioActual = index + 1; // Empezar desde año 1

              // Calcular meses del año usando la función auxiliar (último año proporcional)
              const mesesDelAnio = calcularMesesDelAnio(anioActual);

              console.log(
                `[FLUJO-CAJA] Año ${anioActual}: Meses=${mesesDelAnio.toFixed(2)}`,
              );

              // Obtener datos de amortización para este año si existe
              const amortizacionAnio =
                tablaAmortizacionAnual &&
                tablaAmortizacionAnual.tablaAnual &&
                tablaAmortizacionAnual.tablaAnual[index]
                  ? tablaAmortizacionAnual.tablaAnual[index]
                  : null;

              const ingresosTotales =
                horasOperativasMes * mesesDelAnio * tarifainternaporhora;

              const egresosTotales =
                -1 *
                horasOperativasMes *
                mesesDelAnio *
                (gastodemantenimiento +
                  gastosgenerales +
                  seguroTrecSeleccionado);

              // Obtener interés de amortización para este año (negativo)
              const interesAmortizacion = amortizacionAnio
                ? -amortizacionAnio.interesAnual
                : 0;

              // Calcular depreciación proporcional para el último año
              const esUltimoAnio = anioActual === aniosParaEscenarios;
              const aniosValidos = aniosOperacionEstimados ?? 0;
              const parteDecimal = aniosValidos - Math.floor(aniosValidos);
              const factorProporcional =
                esUltimoAnio && parteDecimal > 0
                  ? mesesDelAnio / datosPrecargados.mesesAlAnio // Factor proporcional: 6.72/12 = 0.56
                  : 1;
              const depreciacionAnualAjustada =
                depreciacionAnual * factorProporcional;

              console.log(
                `[FLUJO-CAJA] Año ${anioActual}: FactorProporcional=${factorProporcional.toFixed(4)}, DepreciaciónAjustada=$${Math.abs(depreciacionAnualAjustada).toLocaleString()}`,
              );

              // Calcular base imponible y impuestos
              const baseImponible =
                ingresosTotales +
                egresosTotales +
                interesAmortizacion +
                depreciacionAnualAjustada;
              const impuestos =
                baseImponible > 0 ? -1 * (baseImponible * tasaImpuestos) : 0; // Negativo porque es egreso

              // Log detallado de cada componente de la base imponible
              console.log(
                `[FLUJO-CAJA] ======== CÁLCULO BASE IMPONIBLE AÑO ${anioActual} ========`,
              );
              console.log(
                `[FLUJO-CAJA] 1. IngresosTotales: $${ingresosTotales.toLocaleString()}`,
              );
              console.log(
                `[FLUJO-CAJA] 2. EgresosTotales: $${egresosTotales.toLocaleString()}`,
              );
              console.log(
                `[FLUJO-CAJA] 3. InterésAmortización: $${interesAmortizacion.toLocaleString()}`,
              );
              console.log(
                `[FLUJO-CAJA] 4. DepreciaciónAnual: $${depreciacionAnual.toLocaleString()}`,
              );
              console.log(`[FLUJO-CAJA] ======== SUMA TOTAL ========`);
              console.log(
                `[FLUJO-CAJA] BaseImponible = ${ingresosTotales} + (${egresosTotales}) + (${interesAmortizacion}) + (${depreciacionAnual})`,
              );
              console.log(
                `[FLUJO-CAJA] BaseImponible = $${baseImponible.toLocaleString()}`,
              );
              console.log(
                `[FLUJO-CAJA] Impuestos (${(tasaImpuestos * 100).toFixed(1)}%): $${Math.abs(impuestos).toLocaleString()}`,
              );

              // Calcular flujo de caja de operación (ingresos + egresos + impuestos)
              const flujo_de_caja_operacion =
                ingresosTotales + egresosTotales + impuestos;

              console.log(
                `[FLUJO-CAJA] ======== FLUJO DE CAJA OPERACIÓN ========`,
              );
              console.log(
                `[FLUJO-CAJA] Flujo = IngresosTotales + EgresosTotales + Impuestos`,
              );
              console.log(
                `[FLUJO-CAJA] Flujo = ${ingresosTotales} + (${egresosTotales}) + (${impuestos})`,
              );
              console.log(
                `[FLUJO-CAJA] Flujo de Caja Operación = $${flujo_de_caja_operacion.toLocaleString()}`,
              );
              console.log(
                `[FLUJO-CAJA] =============================================`,
              );

              const baseEscenario = {
                anio: anioActual,
                nombre: `Año ${anioActual}`,
                mesesDelAnio, // Agregar meses calculados al resultado
                horasOperativasMes, // Horas operativas por mes
                horasOperativasAnio: horasOperativasMes * mesesDelAnio,
                ingresosTotales,
                tarifainternaporhoraBase: tarifainternaporhora,
                egresosTotales,
                gastospormantenimiento:
                  -1 * gastodemantenimiento * horasOperativasMes * mesesDelAnio,
                preventivo:
                  -1 *
                  datosPrecargados.mantenimiento.preventivo *
                  horasOperativasMes *
                  mesesDelAnio,
                correctivo:
                  -1 *
                  datosPrecargados.mantenimiento.correctivo *
                  horasOperativasMes *
                  mesesDelAnio,
                neumaticos:
                  -1 *
                  datosPrecargados.mantenimiento.neumaticos *
                  horasOperativasMes *
                  mesesDelAnio,
                elementosDesgaste:
                  -1 *
                  datosPrecargados.mantenimiento.elementosDesgaste *
                  horasOperativasMes *
                  mesesDelAnio,
                soldadura:
                  -1 *
                  datosPrecargados.mantenimiento.soldadura *
                  horasOperativasMes *
                  mesesDelAnio,
                manoDeObraSupervision:
                  -1 *
                  datosPrecargados.mantenimiento.manoDeObraSupervision *
                  horasOperativasMes *
                  mesesDelAnio,
                gastosgenerales:
                  -1 * gastosgenerales * horasOperativasMes * mesesDelAnio,
                seguro:
                  -1 *
                  seguroTrecSeleccionado *
                  horasOperativasMes *
                  mesesDelAnio,
                depreciacion: depreciacionAnualAjustada, // Depreciación ajustada (proporcional en último año)
                impuestos, // Impuestos calculados (29.5% de la base imponible)
                flujo_de_caja_operacion, // Flujo de caja de operación (ingresos + egresos + impuestos)
              };

              // Agregar información de amortización si existe
              if (amortizacionAnio) {
                return {
                  ...baseEscenario,
                  amortizacion: {
                    capitalAnual: -amortizacionAnio.capitalAnual, // Negativo porque es egreso
                    interesAnual: -amortizacionAnio.interesAnual, // Negativo porque es egreso
                    totalAnualFinanciamiento: -amortizacionAnio.totalAnual, // Total anual de financiamiento (negativo)
                    saldoPendiente: amortizacionAnio.saldoPendiente, // Saldo pendiente (positivo para información)
                  },
                };
              }

              return baseEscenario;
            },
          ),
          tablaAmortizacionAnual,
          // Inversión inicial como elemento separado
          inversionInicial: -datosPrecargados.valorAdquisicion,

          // Resumen del flujo de caja de operación (sumas horizontales)
          resumenFlujoCajaOperacion: {
            vidaUtilHoras: vidaUtilHoras,
            horasOperativasMes: horasOperativasMes, // Horas operativas mensuales (parámetro)
            totalHorasOperativasAnio: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return horasOperativasMes * mesesDelAnio;
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalIngresosTotales: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return horasOperativasMes * mesesDelAnio * tarifainternaporhora;
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalEgresosTotales: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return (
                  -1 *
                  horasOperativasMes *
                  mesesDelAnio *
                  (gastodemantenimiento +
                    gastosgenerales +
                    seguroTrecSeleccionado)
                );
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalGastosMantenimiento: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return (
                  -1 * gastodemantenimiento * horasOperativasMes * mesesDelAnio
                );
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalPreventivo: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return (
                  -1 *
                  datosPrecargados.mantenimiento.preventivo *
                  horasOperativasMes *
                  mesesDelAnio
                );
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalCorrectivo: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return (
                  -1 *
                  datosPrecargados.mantenimiento.correctivo *
                  horasOperativasMes *
                  mesesDelAnio
                );
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalNeumaticos: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return (
                  -1 *
                  datosPrecargados.mantenimiento.neumaticos *
                  horasOperativasMes *
                  mesesDelAnio
                );
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalElementosDesgaste: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return (
                  -1 *
                  datosPrecargados.mantenimiento.elementosDesgaste *
                  horasOperativasMes *
                  mesesDelAnio
                );
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalSoldadura: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return (
                  -1 *
                  datosPrecargados.mantenimiento.soldadura *
                  horasOperativasMes *
                  mesesDelAnio
                );
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalManoObraSupervision: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return (
                  -1 *
                  datosPrecargados.mantenimiento.manoDeObraSupervision *
                  horasOperativasMes *
                  mesesDelAnio
                );
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalGastosGenerales: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return -1 * gastosgenerales * horasOperativasMes * mesesDelAnio;
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalSeguro: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                return (
                  -1 *
                  seguroTrecSeleccionado *
                  horasOperativasMes *
                  mesesDelAnio
                );
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalImpuestos: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                // Calcular impuestos para cada año
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                const ingresosTotales =
                  horasOperativasMes * mesesDelAnio * tarifainternaporhora;
                const egresosTotales =
                  -1 *
                  horasOperativasMes *
                  mesesDelAnio *
                  (gastodemantenimiento +
                    gastosgenerales +
                    seguroTrecSeleccionado);

                // Obtener interés de amortización para este año
                const amortizacionAnio =
                  tablaAmortizacionAnual &&
                  tablaAmortizacionAnual.tablaAnual &&
                  tablaAmortizacionAnual.tablaAnual[index]
                    ? tablaAmortizacionAnual.tablaAnual[index]
                    : null;
                const interesAmortizacion = amortizacionAnio
                  ? -amortizacionAnio.interesAnual
                  : 0;

                // Calcular depreciación proporcional para el último año
                const esUltimoAnio = anioActual === aniosParaEscenarios;
                const aniosValidos = aniosOperacionEstimados ?? 0;
                const parteDecimal = aniosValidos - Math.floor(aniosValidos);
                const factorProporcional =
                  esUltimoAnio && parteDecimal > 0
                    ? mesesDelAnio / datosPrecargados.mesesAlAnio
                    : 1;
                const depreciacionAnualAjustada =
                  depreciacionAnual * factorProporcional;

                const baseImponible =
                  ingresosTotales +
                  egresosTotales +
                  interesAmortizacion +
                  depreciacionAnualAjustada;
                return baseImponible > 0
                  ? -1 * (baseImponible * tasaImpuestos)
                  : 0;
              },
            ).reduce((sum, valor) => sum + valor, 0),
            totalFlujoCajaOperacion: Array.from(
              { length: aniosParaEscenarios },
              (_, index) => {
                // Calcular flujo de operación para cada año
                const anioActual = index + 1;
                const mesesDelAnio = calcularMesesDelAnio(anioActual);
                const ingresosTotales =
                  horasOperativasMes * mesesDelAnio * tarifainternaporhora;
                const egresosTotales =
                  -1 *
                  horasOperativasMes *
                  mesesDelAnio *
                  (gastodemantenimiento +
                    gastosgenerales +
                    seguroTrecSeleccionado);

                // Obtener interés de amortización para este año
                const amortizacionAnio =
                  tablaAmortizacionAnual &&
                  tablaAmortizacionAnual.tablaAnual &&
                  tablaAmortizacionAnual.tablaAnual[index]
                    ? tablaAmortizacionAnual.tablaAnual[index]
                    : null;
                const interesAmortizacion = amortizacionAnio
                  ? -amortizacionAnio.interesAnual
                  : 0;

                // Calcular depreciación proporcional para el último año
                const esUltimoAnio = anioActual === aniosParaEscenarios;
                const aniosValidos = aniosOperacionEstimados ?? 0;
                const parteDecimal = aniosValidos - Math.floor(aniosValidos);
                const factorProporcional =
                  esUltimoAnio && parteDecimal > 0
                    ? mesesDelAnio / datosPrecargados.mesesAlAnio
                    : 1;
                const depreciacionAnualAjustada =
                  depreciacionAnual * factorProporcional;

                const baseImponible =
                  ingresosTotales +
                  egresosTotales +
                  interesAmortizacion +
                  depreciacionAnualAjustada;
                const impuestos =
                  baseImponible > 0 ? -1 * (baseImponible * tasaImpuestos) : 0;

                return ingresosTotales + egresosTotales + impuestos;
              },
            ).reduce((sum, valor) => sum + valor, 0),
          },

          // Generar flujo de caja de inversión
          flujoCajaInversion: this.generarFlujoCajaInversion(
            datosPrecargados.valorAdquisicion,
            valorResidual,
            aniosOperacionEstimados || 5, // Usar 5 años por defecto si es null
            aniosParaEscenarios,
            tablaAmortizacionAnual, // Pasar tabla de amortización para capital anual
            valorComercialRealSeleccionado, // Valor comercial real del escenario seleccionado
          ),

          // Generar flujo de caja de financiamiento
          flujoCajaFinanciamiento: this.generarFlujoCajaFinanciamiento(
            tablaAmortizacionAnual,
            aniosParaEscenarios,
          ),

          // REPORTE FINAL CONSOLIDADO
          reporteFinalConsolidado: this.generarReporteFinalConsolidado(
            aniosParaEscenarios,
            aniosOperacionEstimados || 5,
            horasOperativasMes,
            datosPrecargados,
            tarifainternaporhora,
            gastodemantenimiento,
            gastosgenerales,
            seguroTrecSeleccionado,
            depreciacionAnual,
            tasaImpuestos,
            tablaAmortizacionAnual,
            valorResidual,
            datosPrecargados.valorAdquisicion,
            response.parametros.tasaDescuentoEmpresa, // Tasa de descuento de la empresa
            valorComercialRealSeleccionado, // Valor comercial real del escenario seleccionado
          ),

          // ESTADO DE RESULTADOS
          estadoDeResultados: this.generarEstadoDeResultados(
            aniosParaEscenarios,
            aniosOperacionEstimados || 5,
            depreciacionAnual,
            valorResidual,
            horasOperativasMes,
            datosPrecargados,
            tarifainternaporhora,
            gastodemantenimiento,
            gastosgenerales,
            seguroTrecSeleccionado,
            tasaImpuestos,
            tablaAmortizacionAnual,
            valorComercialRealSeleccionado, // Valor comercial real del escenario seleccionado
          ),
        },
      },
    };

    // Log del resumen del flujo de caja de operación
    console.log(
      `[FLUJO-CAJA] ========== RESUMEN FLUJO DE CAJA OPERACIÓN ==========`,
    );
    const resumen =
      resultadoConCalculo.resultadoFlujo.FlujoDecajaOperacion
        .resumenFlujoCajaOperacion;
    console.log(
      `[FLUJO-CAJA] Vida útil (horas): ${resumen.vidaUtilHoras.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Horas operativas/mes (parámetro): ${resumen.horasOperativasMes.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL horas operativas año (suma horizontal): ${resumen.totalHorasOperativasAnio.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Ingresos: $${resumen.totalIngresosTotales.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Egresos: $${resumen.totalEgresosTotales.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Gastos mantenimiento: $${Math.abs(resumen.totalGastosMantenimiento).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Preventivo: $${Math.abs(resumen.totalPreventivo).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Correctivo: $${Math.abs(resumen.totalCorrectivo).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Neumáticos: $${Math.abs(resumen.totalNeumaticos).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Elementos desgaste: $${Math.abs(resumen.totalElementosDesgaste).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Soldadura: $${Math.abs(resumen.totalSoldadura).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Mano obra supervisión: $${Math.abs(resumen.totalManoObraSupervision).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Gastos generales: $${Math.abs(resumen.totalGastosGenerales).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Seguro: $${Math.abs(resumen.totalSeguro).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Impuestos: $${Math.abs(resumen.totalImpuestos).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Flujo caja operación: $${resumen.totalFlujoCajaOperacion.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] ========================================================`,
    );

    return serializeBigInt(resultadoConCalculo);
  }

  /**
   * Calcula tabla de amortización anual usando la fórmula francesa
   * @param capital - Valor del préstamo (valor de adquisición)
   * @param tasaFinanciamientoAnual - Tasa de financiamiento anual
   * @param mesesPorAnio - Meses por año (normalmente 12)
   * @param aniosFinanciamiento - Años de financiamiento
   * @returns Tabla de amortización con desglose anual
   */
  private calcularTablaAmortizacionAnual(
    capital: number,
    tasaFinanciamientoAnual: number,
    mesesPorAnio: number,
    aniosFinanciamiento: number,
  ) {
    if (
      capital <= 0 ||
      tasaFinanciamientoAnual <= 0 ||
      aniosFinanciamiento <= 0
    ) {
      return {
        tablaAnual: [],
        resumen: {
          capitalTotal: 0,
          interesTotal: 0,
          sumaTotal: 0,
          cuotaMensual: 0,
        },
      };
    }

    // TEA: Tasa Efectiva Mensual
    const tea = Math.pow(1 + tasaFinanciamientoAnual, 1 / mesesPorAnio) - 1;
    const periodos = mesesPorAnio * aniosFinanciamiento;

    // Cálculo de la cuota mensual usando la fórmula francesa
    const denominador = 1 - Math.pow(1 + tea, -periodos);
    const cuotaMensual = (capital * tea) / denominador;

    // Generar tabla mensual primero
    let saldoPendiente = capital;
    const tablaMensual: Array<{
      mes: number;
      cuotaMensual: number;
      capitalMes: number;
      interesMes: number;
      saldoPendiente: number;
    }> = [];

    for (let mes = 1; mes <= periodos; mes++) {
      const interesMes = saldoPendiente * tea;
      const capitalMes = cuotaMensual - interesMes;
      saldoPendiente -= capitalMes;

      // Ajustar último mes para evitar saldos negativos por redondeo
      if (mes === periodos) {
        saldoPendiente = 0;
      }

      tablaMensual.push({
        mes,
        cuotaMensual,
        capitalMes,
        interesMes,
        saldoPendiente,
      });
    }

    // Agrupar por años
    const tablaAnual: Array<{
      anio: number;
      capitalAnual: number;
      interesAnual: number;
      totalAnual: number;
      saldoPendiente: number;
    }> = [];
    let capitalTotalAcum = 0;
    let interesTotalAcum = 0;

    for (let anio = 1; anio <= aniosFinanciamiento; anio++) {
      const mesInicio = (anio - 1) * mesesPorAnio;
      const mesFin = anio * mesesPorAnio;

      const mesesDelAnio = tablaMensual.slice(mesInicio, mesFin);

      const capitalAnual = mesesDelAnio.reduce(
        (sum, mes) => sum + mes.capitalMes,
        0,
      );
      const interesAnual = mesesDelAnio.reduce(
        (sum, mes) => sum + mes.interesMes,
        0,
      );
      const totalAnual = capitalAnual + interesAnual;

      capitalTotalAcum += capitalAnual;
      interesTotalAcum += interesAnual;

      // Saldo pendiente al final del año (último mes del año)
      const saldoPendienteFinAnio =
        mesesDelAnio[mesesDelAnio.length - 1]?.saldoPendiente || 0;

      tablaAnual.push({
        anio,
        capitalAnual: Number(capitalAnual.toFixed(2)),
        interesAnual: Number(interesAnual.toFixed(2)),
        totalAnual: Number(totalAnual.toFixed(2)),
        saldoPendiente: Number(saldoPendienteFinAnio.toFixed(2)),
      });
    }

    return {
      tablaAnual,
      resumen: {
        capitalTotal: Number(capitalTotalAcum.toFixed(2)),
        interesTotal: Number(interesTotalAcum.toFixed(2)),
        sumaTotal: Number((capitalTotalAcum + interesTotalAcum).toFixed(2)),
        cuotaMensual: Number(cuotaMensual.toFixed(2)),
      },
    };
  }

  /**
   * Valida UUID para usuarioId
   */
  private validateUsuarioId(usuarioId?: string): string | undefined {
    if (!usuarioId) return undefined;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(usuarioId) ? usuarioId : undefined;
  }

  /**
   * Guarda el análisis de flujo de caja en la base de datos
   */
  async guardarAnalisis(data: FlujoCajaResponse): Promise<any> {
    try {
      console.log(
        `[FLUJO-CAJA] Guardando análisis para máquina: ${data.machine.id}`,
      );

      const validUsuarioId = this.validateUsuarioId(data.parametros.usuarioId);

      const flujoHistorial = await this.prisma.flujoHistorial.create({
        data: {
          machine_id: Number(data.machine.id),
          usuario_id: validUsuarioId,

          // Inputs específicos
          porcentaje_residual: data.parametros.porcentajeResidual,
          margen_interno: data.parametros.margenInterno,
          gastos_generales_mantenimiento:
            data.parametros.gastosGeneralesMantenimiento, // Se almacena el valor calculado (porcentaje * total)
          horas_operativas_mes: data.parametros.horasOperativasMes,
          tasa_descuento_empresa: data.parametros.tasaDescuentoEmpresa,

          // Resultado del análisis
          resultado_flujo_json: data.resultadoFlujo as any,

          // Datos adicionales (datos precargados y otros)
          otros_datos_json: {
            datosPrecargados: data.datosPrecargados,
            otrosDatos: data.otrosDatos,
            comentario: data.parametros.comentario,
            estado: data.estado,
          } as any,

          // fecha_calculo se maneja automáticamente
        },
      });

      console.log(
        `[FLUJO-CAJA] Análisis guardado con ID: ${flujoHistorial.id}`,
      );

      const result = {
        ...flujoHistorial,
        machine_info: {
          id: data.machine.id,
          marca: data.machine.marca,
          modelo: data.machine.modelo,
        },
      };

      return serializeBigInt(result);
    } catch (error: unknown) {
      console.error('Error guardando análisis de flujo de caja:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de análisis de flujo para una máquina
   */
  async findHistorialByMachine(machineId: number): Promise<any[]> {
    try {
      const historial = await this.prisma.flujoHistorial.findMany({
        where: {
          machine_id: machineId,
          deleted_at: null, // Solo registros no eliminados
        },
        orderBy: { fecha_calculo: 'desc' },
      });

      return serializeBigInt(historial);
    } catch (error: unknown) {
      console.error(
        `Error obteniendo historial flujo para máquina ${machineId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Obtiene un registro específico del historial
   */
  async findHistorialById(id: number): Promise<any> {
    try {
      const historial = await this.prisma.flujoHistorial.findUnique({
        where: { id },
        include: {
          machines: {
            include: {
              modelo: {
                include: {
                  marca: true,
                  equipo: true,
                },
              },
            },
          },
        },
      });

      if (!historial) {
        throw new NotFoundException(
          `Análisis de flujo con ID ${id} no encontrado`,
        );
      }

      return serializeBigInt(historial);
    } catch (error: unknown) {
      console.error(`Error obteniendo análisis flujo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Calcula y guarda automáticamente el análisis de flujo de caja
   */
  async calcularYGuardar(dto: CreateAnalisisFlujoDto): Promise<any> {
    try {
      // Primero hacer el preview (cálculo)
      const calculoCompleto = await this.preview(dto);

      // Luego guardarlo
      return await this.guardarAnalisis(calculoCompleto);
    } catch (error: unknown) {
      console.error('Error calculando y guardando análisis:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los análisis de flujo de caja
   */
  async findTodos(): Promise<any[]> {
    try {
      const analisis = await this.prisma.flujoHistorial.findMany({
        where: {
          deleted_at: null,
        },
        include: {
          machines: {
            include: {
              modelo: {
                include: {
                  marca: true,
                  equipo: true,
                },
              },
            },
          },
        },
        orderBy: { fecha_calculo: 'desc' },
      });

      return serializeBigInt(analisis);
    } catch (error: unknown) {
      console.error('Error obteniendo todos los análisis:', error);
      throw error;
    }
  }

  /**
   * Obtiene solo versiones (nombres y fechas) para selección rápida
   * @param machineId - ID de la máquina (opcional). Si se proporciona, filtra versiones por máquina.
   */
  async findVersiones(machineId?: number): Promise<any[]> {
    console.log(
      `[FLUJO-CAJA] Obteniendo versiones disponibles${machineId ? ` para máquina ${machineId}` : ''}...`,
    );

    try {
      const versiones = await this.prisma.flujoHistorial.findMany({
        where: {
          deleted_at: null,
          ...(machineId && { machine_id: machineId }),
        },
        include: {
          machines: {
            include: {
              modelo: {
                include: {
                  marca: true,
                },
              },
            },
          },
        },
        orderBy: { fecha_calculo: 'desc' },
      });

      // Formatear para mostrar solo lo necesario
      const formattedVersions = versiones.map((version) => {
        const otrosDatos = version.otros_datos_json as any;
        const comentario = otrosDatos?.comentario || '';
        const marca = version.machines?.modelo?.marca?.nombre || '';
        const modelo = version.machines?.modelo?.nombre || '';

        return {
          id: Number(version.id),
          nombre: comentario || `${marca} ${modelo}`,
          fechaCalculo: version.fecha_calculo,
          machine: {
            id: Number(version.machines?.id),
            marca,
            modelo,
          },
        };
      });

      return serializeBigInt(formattedVersions);
    } catch (error: unknown) {
      console.error('Error obteniendo versiones:', error);
      throw error;
    }
  }

  /**
   * Obtiene un análisis específico por ID (alias de findHistorialById)
   */
  async findById(id: number): Promise<any> {
    return this.findHistorialById(id);
  }

  /**
   * Extrae únicamente los escenarios de horas del último informe de costo horario
   */
  async extraerEscenarios(machineId: number): Promise<any> {
    try {
      console.log(`[FLUJO-CAJA] ========== EXTRAYENDO ESCENARIOS ==========`);
      console.log(`[FLUJO-CAJA] Machine ID: ${machineId}`);

      // Obtener la máquina básica
      const machine = await this.prisma.machines.findUnique({
        where: { id: machineId },
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
            },
          },
        },
      });

      if (!machine) {
        throw new NotFoundException(
          `Máquina con ID ${machineId} no encontrada`,
        );
      }

      console.log(
        `[FLUJO-CAJA] Máquina encontrada: ${machine.modelo?.marca?.nombre} ${machine.modelo?.nombre}`,
      );

      // Obtener el informe más reciente
      const informeCostoHorario =
        await this.getUltimoInformeCostoHorario(machineId);

      console.log(
        `[FLUJO-CAJA] Informe más reciente ID: ${informeCostoHorario.id}`,
      );

      // Extraer datos del JSON del informe
      const informeData = informeCostoHorario.resultado_completo_json as any;

      if (!informeData) {
        throw new NotFoundException(
          `Informe de costo horario ${informeCostoHorario.id} no tiene datos de cálculo`,
        );
      }

      const mesesAlAnio = informeData.parametros?.mesesPorAnio || 12;

      // Extraer escenarios de horas desde el informe
      const escenariosHoras = (informeData.escenarios || []).map(
        (escenario: any, index: number) => {
          const horasMinimas = escenario.horasMinimas || 0;
          const gradoOperatividad = escenario.gradoOperatividad || 0;
          const factorMercado = escenario.factorMercado || 0;
          const horasUsoAnual =
            escenario.horasUsoAnual || horasMinimas * mesesAlAnio;

          // Extraer seguro TREC de seccion3 y valor comercial real de seccion2
          const seccion3Escenario = escenario.seccion3?.posesion || {};
          const seccion2Escenario = escenario.seccion2?.descripcion || {};
          const seguroTrecEscenario = Number(seccion3Escenario.seguroTrec || 0);
          const valorComercialRealEscenario = Number(
            seccion2Escenario.valorComercialReal || 0,
          );

          console.log(
            `[FLUJO-CAJA] Escenario ${index + 1}: Hmin=${horasMinimas}, Grado=${gradoOperatividad}, Factor=${factorMercado}, HorasAnual=${horasUsoAnual}, SeguroTREC=${seguroTrecEscenario}, ValorComercialReal=${valorComercialRealEscenario}`,
          );

          return {
            escenarioId: index + 1,
            horasMinimas,
            gradoOperatividad,
            factorMercado,
            horasUsoAnual,
            seguroTrec: seguroTrecEscenario,
            valorComercialReal: valorComercialRealEscenario,
            mesesAlAnio,
          };
        },
      );

      const response = {
        machine: {
          id: Number(machine.id),
          item: Number(machine.id),
          equipo: machine.modelo?.equipo?.nombre || null,
          marca: machine.modelo?.marca?.nombre || null,
          modelo: machine.modelo?.nombre || null,
          estado: machine.estado,
          idEquipo: machine.id_equipo_interno,
        },
        informeOrigen: {
          id: informeCostoHorario.id,
          fechaCalculo: informeCostoHorario.fecha_calculo,
        },
        escenarios: escenariosHoras,
        totalEscenarios: escenariosHoras.length,
        extractedAt: new Date().toISOString(),
      };

      console.log(
        `[FLUJO-CAJA] Escenarios extraídos: ${escenariosHoras.length} escenarios`,
      );
      console.log(`[FLUJO-CAJA] ========== EXTRACCIÓN COMPLETADA ==========`);

      return serializeBigInt(response);
    } catch (error: unknown) {
      console.error('Error extrayendo escenarios:', error);
      throw error;
    }
  }

  /**
   * Genera el flujo de caja de inversión
   * @param valorAdquisicion - Valor de adquisición de la máquina
   * @param valorResidual - Valor residual calculado
   * @param aniosOperacionEstimados - Años de operación estimados (puede tener decimales)
   * @param aniosParaEscenarios - Años enteros para los escenarios
   * @param tablaAmortizacionAnual - Tabla de amortización para obtener capital anual
   * @param valorComercialReal - Valor comercial real del escenario seleccionado (usado para venta)
   */
  private generarFlujoCajaInversion(
    valorAdquisicion: number,
    valorResidual: number,
    aniosOperacionEstimados: number,
    aniosParaEscenarios: number,
    tablaAmortizacionAnual: any,
    valorComercialReal: number = 0,
  ) {
    console.log(
      `[FLUJO-CAJA] ========== GENERANDO FLUJO CAJA INVERSIÓN ==========`,
    );
    console.log(
      `[FLUJO-CAJA] Valor adquisición: $${valorAdquisicion.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Valor residual: $${valorResidual.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Valor comercial real (usado para venta): $${valorComercialReal.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Años operación estimados: ${aniosOperacionEstimados}`,
    );
    console.log(`[FLUJO-CAJA] Años para escenarios: ${aniosParaEscenarios}`);

    // Determinar dónde colocar el valor residual basado en la parte decimal:
    // Si decimal < 0.5 → parteEntera + 1
    // Si decimal >= 0.5 → parteEntera + 2
    // Ejemplos: 3.03→4, 3.5→5, 4.3→5, 4.5→6, 4.6→6, 5.0→6

    const parteEntera = Math.floor(aniosOperacionEstimados);
    const parteDecimal = aniosOperacionEstimados - parteEntera;

    let anioValorResidual;
    if (parteDecimal < 0.5) {
      // Decimal menor a 0.5: sumar 1 año
      anioValorResidual = parteEntera + 1;
    } else {
      // Decimal mayor o igual a 0.5: sumar 2 años
      anioValorResidual = parteEntera + 2;
    }

    // Verificar si necesitamos crear un año adicional más allá de los escenarios calculados
    const debeCrearAnioAdicional = anioValorResidual > aniosParaEscenarios;

    console.log(
      `[FLUJO-CAJA] Años estimados: ${aniosOperacionEstimados} → ParteEntera=${parteEntera}, Decimal=${parteDecimal.toFixed(2)}`,
    );
    console.log(
      `[FLUJO-CAJA] Criterio: ${parteDecimal < 0.5 ? `${parteDecimal.toFixed(2)} < 0.5 → ${parteEntera}+1` : `${parteDecimal.toFixed(2)} ≥ 0.5 → ${parteEntera}+2`}`,
    );
    console.log(
      `[FLUJO-CAJA] Año calculado para valor residual: ${anioValorResidual}`,
    );
    console.log(
      `[FLUJO-CAJA] ¿Crear año adicional? ${debeCrearAnioAdicional ? 'SÍ' : 'NO'} (${anioValorResidual} ${debeCrearAnioAdicional ? '>' : '≤'} ${aniosParaEscenarios})`,
    );

    // Generar la estructura del flujo de caja de inversión (SIN AÑO 0)
    const flujoCajaInversion = {
      concepto: 'FLUJO DE CAJA DE INVERSIÓN',
      descripcion: 'Capex, compra y venta de activos',

      // Determinar el número total de años a mostrar
      totalAnios: debeCrearAnioAdicional
        ? aniosParaEscenarios + 1
        : aniosParaEscenarios,

      // Años operativos (desde 1 hasta el total necesario)
      aniosOperativos: Array.from(
        {
          length: debeCrearAnioAdicional
            ? aniosParaEscenarios + 1
            : aniosParaEscenarios,
        },
        (_, index) => {
          const anioActual = index + 1;
          const esAnioValorResidual = anioActual === anioValorResidual;

          // Obtener capital anual de la tabla de amortización para este año
          let capitalAnualAmortizacion = 0;
          if (tablaAmortizacionAnual && tablaAmortizacionAnual.tablaAnual) {
            const datosAmortizacion = tablaAmortizacionAnual.tablaAnual.find(
              (anio: any) => anio.anio === anioActual,
            );
            if (datosAmortizacion) {
              capitalAnualAmortizacion = -datosAmortizacion.capitalAnual; // Negativo porque es pago de capital
            }
          }

          // Venta solo en año del valor residual (usando valorComercialReal del escenario)
          const venta = esAnioValorResidual ? valorComercialReal : 0;

          // CAPEX = capital anual de amortización + venta (si hay valor comercial real)
          const capex = capitalAnualAmortizacion + venta;

          // Compra = igual al capital de amortización (NO incluye venta)
          const compra = capitalAnualAmortizacion;

          // Flujo total de inversión
          const flujoInversion = capex;

          return {
            anio: anioActual,
            nombre: `Año ${anioActual}`,
            capex, // Solo capital anual de amortización
            compra, // Igual al capex
            venta, // Venta solo en año del valor residual
            flujoInversion, // Suma total del flujo de inversión
          };
        },
      ),

      // Resumen
      resumen: {
        inversionTotal: -valorAdquisicion,
        valorResidualRecuperado: valorResidual,
        valorComercialRealRecuperado: valorComercialReal,
        flujoNetoInversion: -valorAdquisicion + valorComercialReal,
        anioRecuperacionValorResidual: anioValorResidual,
        criterioUbicacion: `Valor comercial real en año ${anioValorResidual} (Años estimados: ${aniosOperacionEstimados} → Parte entera: ${parteEntera}, Decimal: ${parteDecimal.toFixed(2)} ${parteDecimal < 0.5 ? '< 0.5 → +1 año' : '≥ 0.5 → +2 años'})`,
        // Calcular totales de capex
        capexTotal: (() => {
          let totalCapex = 0;
          // Sumar capital anual de amortización (negativo)
          if (tablaAmortizacionAnual && tablaAmortizacionAnual.tablaAnual) {
            totalCapex += tablaAmortizacionAnual.tablaAnual.reduce(
              (sum: number, anio: any) => sum + -anio.capitalAnual,
              0,
            );
          }
          // Sumar valor comercial real (positivo)
          totalCapex += valorComercialReal;
          return totalCapex;
        })(),
      },
    };

    console.log(
      `[FLUJO-CAJA] ========== FLUJO CAJA INVERSIÓN GENERADO ==========`,
    );

    return flujoCajaInversion;
  }

  /**
   * Genera el flujo de caja de financiamiento basado en la tabla de amortización
   * @param tablaAmortizacionAnual - Tabla de amortización con desglose anual
   * @param aniosParaEscenarios - Años enteros para los escenarios
   */
  private generarFlujoCajaFinanciamiento(
    tablaAmortizacionAnual: any,
    aniosParaEscenarios: number,
  ) {
    console.log(
      `[FLUJO-CAJA] ========== GENERANDO FLUJO CAJA FINANCIAMIENTO ==========`,
    );

    // Si no hay tabla de amortización, no hay financiamiento
    if (!tablaAmortizacionAnual || !tablaAmortizacionAnual.tablaAnual) {
      console.log(
        `[FLUJO-CAJA] Sin tabla de amortización - No hay financiamiento`,
      );
      return {
        concepto: 'FLUJO DE CAJA DE FINANCIAMIENTO',
        descripcion: 'Sin financiamiento - Pago al contado',
        aniosOperativos: Array.from(
          { length: aniosParaEscenarios },
          (_, index) => ({
            anio: index + 1,
            nombre: `Año ${index + 1}`,
            capex: 0,
            interesesFinanciamiento: 0,
            flujoFinanciamiento: 0,
          }),
        ),
        resumen: {
          totalCapital: 0,
          totalIntereses: 0,
          totalFinanciamiento: 0,
        },
      };
    }

    const { tablaAnual, resumen } = tablaAmortizacionAnual;

    console.log(
      `[FLUJO-CAJA] Tabla amortización disponible - ${tablaAnual.length} años`,
    );
    console.log(
      `[FLUJO-CAJA] Capital total: $${resumen.capitalTotal.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Interés total: $${resumen.interesTotal.toLocaleString()}`,
    );

    // Generar la estructura del flujo de caja de financiamiento (SOLO INTERESES)
    const flujoCajaFinanciamiento = {
      concepto: 'FLUJO DE CAJA DE FINANCIAMIENTO',
      descripcion: 'Intereses por financiamiento',

      // Años operativos con datos de financiamiento (solo intereses)
      aniosOperativos: Array.from(
        { length: aniosParaEscenarios },
        (_, index) => {
          const anioActual = index + 1;

          // Buscar datos de amortización para este año
          const datosAmortizacion = tablaAnual.find(
            (anio: any) => anio.anio === anioActual,
          );

          if (datosAmortizacion) {
            // Año con financiamiento activo - SOLO INTERESES
            const intereses = -datosAmortizacion.interesAnual; // Interés (negativo porque es pago)

            console.log(
              `[FLUJO-CAJA] Año ${anioActual}: Solo Interés=$${Math.abs(intereses).toLocaleString()}`,
            );

            return {
              anio: anioActual,
              nombre: `Año ${anioActual}`,
              capex: intereses, // Mismo valor que los intereses
              interesesFinanciamiento: intereses, // Intereses (negativo)
              flujoFinanciamiento: intereses, // Mismo valor que los intereses
            };
          } else {
            // Año sin financiamiento (préstamo ya pagado)
            return {
              anio: anioActual,
              nombre: `Año ${anioActual}`,
              capex: 0,
              interesesFinanciamiento: 0,
              flujoFinanciamiento: 0,
            };
          }
        },
      ),

      // Resumen del financiamiento (sumas horizontales de los 3 campos)
      resumen: {
        totalCapex: -resumen.interesTotal, // Suma horizontal de capex (todos tienen valor de intereses)
        totalInteresesFinanciamiento: -resumen.interesTotal, // Suma horizontal de interesesFinanciamiento
        totalFlujoFinanciamiento: -resumen.interesTotal, // Suma horizontal de flujoFinanciamiento
        cuotaMensual: resumen.cuotaMensual,
        aniosFinanciamiento: tablaAnual.length,
      },
    };

    console.log(
      `[FLUJO-CAJA] ========== FLUJO CAJA FINANCIAMIENTO GENERADO ==========`,
    );

    return flujoCajaFinanciamiento;
  }

  /**
   * Genera el reporte final consolidado con flujos resultantes y acumulados
   */
  private generarReporteFinalConsolidado(
    aniosParaEscenarios: number,
    aniosOperacionEstimados: number,
    horasOperativasMes: number,
    datosPrecargados: any,
    tarifainternaporhora: number,
    gastodemantenimiento: number,
    gastosgenerales: number,
    seguroTrecSeleccionado: number,
    depreciacionAnual: number,
    tasaImpuestos: number,
    tablaAmortizacionAnual: any,
    valorResidual: number,
    valorAdquisicion: number,
    tasaDescuentoEmpresa: number,
    valorComercialReal: number = 0,
  ) {
    console.log(
      `[FLUJO-CAJA] ========== GENERANDO REPORTE FINAL CONSOLIDADO ==========`,
    );

    // Determinar el número máximo de años para el reporte (considerando valor residual)
    const anioValorResidual = this._determinarAnioValorResidual(
      aniosOperacionEstimados,
    );

    const aniosMaximos = Math.max(aniosParaEscenarios, anioValorResidual);

    console.log(`[FLUJO-CAJA] Años para escenarios: ${aniosParaEscenarios}`);
    console.log(`[FLUJO-CAJA] Año valor residual: ${anioValorResidual}`);
    console.log(`[FLUJO-CAJA] Años máximos para reporte: ${aniosMaximos}`);

    // Función auxiliar para calcular meses del año (último año proporcional)
    const calcularMesesDelAnio = (anioActual: number): number => {
      const esUltimoAnio = anioActual === aniosParaEscenarios;
      const aniosValidos = aniosOperacionEstimados ?? 0;
      const parteDecimal = aniosValidos - Math.floor(aniosValidos);
      return esUltimoAnio && parteDecimal > 0
        ? parteDecimal * datosPrecargados.mesesAlAnio
        : datosPrecargados.mesesAlAnio;
    };

    // Generar flujos por año
    const aniosReporte = Array.from({ length:   aniosMaximos }, (_, index) => {
      const anioActual = index + 1;

      // FLUJO DE CAJA DE OPERACIÓN
      let flujoOperacion = 0;
      if (anioActual <= aniosParaEscenarios) {
        const mesesDelAnio = calcularMesesDelAnio(anioActual);
        const ingresosTotales =
          horasOperativasMes * mesesDelAnio * tarifainternaporhora;
        const egresosTotales =
          -1 *
          horasOperativasMes *
          mesesDelAnio *
          (gastodemantenimiento + gastosgenerales + seguroTrecSeleccionado);

        // Obtener interés de amortización para este año
        const amortizacionAnio =
          tablaAmortizacionAnual &&
          tablaAmortizacionAnual.tablaAnual &&
          tablaAmortizacionAnual.tablaAnual[index]
            ? tablaAmortizacionAnual.tablaAnual[index]
            : null;
        const interesAmortizacion = amortizacionAnio
          ? -amortizacionAnio.interesAnual
          : 0;

        // Calcular depreciación proporcional para el último año
        const esUltimoAnio = anioActual === aniosParaEscenarios;
        const aniosValidos = aniosOperacionEstimados ?? 0;
        const parteDecimal = aniosValidos - Math.floor(aniosValidos);
        const factorProporcional =
          esUltimoAnio && parteDecimal > 0
            ? mesesDelAnio / datosPrecargados.mesesAlAnio
            : 1;
        const depreciacionAnualAjustada =
          depreciacionAnual * factorProporcional;

        const baseImponible =
          ingresosTotales +
          egresosTotales +
          interesAmortizacion +
          depreciacionAnualAjustada;
        const impuestos =
          baseImponible > 0 ? -1 * (baseImponible * tasaImpuestos) : 0;

        flujoOperacion = ingresosTotales + egresosTotales + impuestos;
      }

      // FLUJO DE CAJA DE INVERSIÓN
      let flujoInversion = 0;
      if (anioActual <= aniosParaEscenarios) {
        // Obtener capital anual de la tabla de amortización
        const datosAmortizacion =
          tablaAmortizacionAnual &&
          tablaAmortizacionAnual.tablaAnual &&
          tablaAmortizacionAnual.tablaAnual.find(
            (anio: any) => anio.anio === anioActual,
          );
        const capitalAnualAmortizacion = datosAmortizacion
          ? -datosAmortizacion.capitalAnual
          : 0;

        flujoInversion = capitalAnualAmortizacion;
      }

      // Agregar valor comercial real si corresponde a este año
      if (anioActual === anioValorResidual) {
        flujoInversion += valorComercialReal;
      }

      // FLUJO DE CAJA DE FINANCIAMIENTO
      let flujoFinanciamiento = 0;
      if (anioActual <= aniosParaEscenarios) {
        const datosAmortizacion =
          tablaAmortizacionAnual &&
          tablaAmortizacionAnual.tablaAnual &&
          tablaAmortizacionAnual.tablaAnual.find(
            (anio: any) => anio.anio === anioActual,
          );
        if (datosAmortizacion) {
          flujoFinanciamiento = -datosAmortizacion.interesAnual; // Solo intereses
        }
      }

      return {
        anio: anioActual,
        nombre: `Año ${anioActual}`,
        flujoOperacion,
        flujoInversion,
        flujoFinanciamiento,
      };
    });

    // Calcular flujos resultantes y acumulados
    let acumulado = 0;
    const reporteConsolidado = aniosReporte.map((anio, index) => {
      const flujoResultante =
        anio.flujoOperacion + anio.flujoInversion + anio.flujoFinanciamiento;
      acumulado += flujoResultante;

      return {
        anio: anio.anio,
        nombre: anio.nombre,
        flujoOperacion: anio.flujoOperacion,
        flujoInversion: anio.flujoInversion,
        flujoFinanciamiento: anio.flujoFinanciamiento,
        flujoResultante,
        flujoResultanteAcumulado: acumulado,
      };
    });

    // Calcular totales
    const totalFlujoOperacion = reporteConsolidado.reduce(
      (sum, anio) => sum + anio.flujoOperacion,
      0,
    );
    const totalFlujoInversion = reporteConsolidado.reduce(
      (sum, anio) => sum + anio.flujoInversion,
      0,
    );
    const totalFlujoFinanciamiento = reporteConsolidado.reduce(
      (sum, anio) => sum + anio.flujoFinanciamiento,
      0,
    );
    const totalFlujoResultante = reporteConsolidado.reduce(
      (sum, anio) => sum + anio.flujoResultante,
      0,
    );

    const reporte = {
      concepto: 'REPORTE FINAL CONSOLIDADO',
      descripcion: 'Flujos de caja consolidados y resultantes',
      aniosMaximos,
      anioValorResidual,

      // Años operativos
      aniosOperativos: reporteConsolidado,

      // Resumen de totales
      resumen: {
        totalFlujoOperacion,
        totalFlujoInversion,
        totalFlujoFinanciamiento,
        totalFlujoResultante,
        flujoResultanteFinal: acumulado, // Solo flujos operativos
        inversionInicial: -valorAdquisicion,
        valorResidualRecuperado: valorResidual,
        valorComercialRealRecuperado: valorComercialReal,
        anioRecuperacionValorResidual: anioValorResidual,
      },
    };

    console.log(`[FLUJO-CAJA] ========== REPORTE FINAL CONSOLIDADO ==========`);
    console.log(
      `[FLUJO-CAJA] TOTAL Flujo Operación: $${totalFlujoOperacion.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Flujo Inversión: $${totalFlujoInversion.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Flujo Financiamiento: $${totalFlujoFinanciamiento.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Flujo Resultante: $${totalFlujoResultante.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Flujo Resultante Final: $${reporte.resumen.flujoResultanteFinal.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Último acumulado: $${acumulado.toLocaleString()}`,
    );

    // Log detallado por años
    reporteConsolidado.forEach((anio) => {
      console.log(`[FLUJO-CAJA] ${anio.nombre}:`);
      console.log(`  - Operación: $${anio.flujoOperacion.toLocaleString()}`);
      console.log(`  - Inversión: $${anio.flujoInversion.toLocaleString()}`);
      console.log(
        `  - Financiamiento: $${anio.flujoFinanciamiento.toLocaleString()}`,
      );
      console.log(`  - Resultante: $${anio.flujoResultante.toLocaleString()}`);
      console.log(
        `  - Acumulado: $${anio.flujoResultanteAcumulado.toLocaleString()}`,
      );
    });

    console.log(
      `[FLUJO-CAJA] ================================================`,
    );

    // Agregar cálculos de VAN y TIR al reporte
    const reporteConAnalisisFinanciero = this.agregarAnalisisFinanciero(
      reporte,
      valorAdquisicion,
      tasaDescuentoEmpresa, // Usar la tasa de descuento de la empresa desde parámetros
    );

    return reporteConAnalisisFinanciero;
  }

  /**
   * Genera el estado de resultados con depreciación, enajenación y venta
   */
  private generarEstadoDeResultados(
    aniosParaEscenarios: number,
    aniosOperacionEstimados: number,
    depreciacionAnual: number,
    valorResidual: number,
    horasOperativasMes: number,
    datosPrecargados: any,
    tarifainternaporhora: number,
    gastodemantenimiento: number,
    gastosgenerales: number,
    seguroTrecSeleccionado: number,
    tasaImpuestos: number,
    tablaAmortizacionAnual: any,
    valorComercialReal: number = 0,
  ) {
    console.log(
      `[FLUJO-CAJA] ========== GENERANDO ESTADO DE RESULTADOS ==========`,
    );

    // Determinar el año donde va el valor residual (mismo criterio que antes)
    const anioValorResidual = this._determinarAnioValorResidual(
      aniosOperacionEstimados,
    );

    const aniosMaximos = Math.max(aniosParaEscenarios, anioValorResidual);

    console.log(
      `[FLUJO-CAJA] Años máximos para estado de resultados: ${aniosMaximos}`,
    );
    console.log(`[FLUJO-CAJA] Año valor residual: ${anioValorResidual}`);
    console.log(
      `[FLUJO-CAJA] Depreciación anual: $${Math.abs(depreciacionAnual).toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Valor residual (enajenación): $${valorResidual.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Valor comercial real (venta): $${valorComercialReal.toLocaleString()}`,
    );

    // Función auxiliar para calcular meses del año (último año proporcional)
    const calcularMesesDelAnio = (anioActual: number): number => {
      const esUltimoAnio = anioActual === aniosParaEscenarios;
      const aniosValidos = aniosOperacionEstimados ?? 0;
      const parteDecimal = aniosValidos - Math.floor(aniosValidos);
      return esUltimoAnio && parteDecimal > 0
        ? parteDecimal * datosPrecargados.mesesAlAnio
        : datosPrecargados.mesesAlAnio;
    };

    // Generar estado de resultados por año
    const aniosEstadoResultados = Array.from(
      { length: aniosMaximos },
      (_, index) => {
        const anioActual = index + 1;

        // Calcular flujo de caja de operación para este año
        let flujoCajaOperacion = 0;
        // Calcular depreciación proporcional para el último año
        const mesesDelAnio = calcularMesesDelAnio(anioActual);
        const esUltimoAnio = anioActual === aniosParaEscenarios;
        const aniosValidos = aniosOperacionEstimados ?? 0;
        const parteDecimal = aniosValidos - Math.floor(aniosValidos);
        const factorProporcional =
          esUltimoAnio && parteDecimal > 0
            ? mesesDelAnio / datosPrecargados.mesesAlAnio
            : 1;
        const depreciacionAnualAjustada =
          depreciacionAnual * factorProporcional;

        if (anioActual <= aniosParaEscenarios) {
          const ingresosTotales =
            horasOperativasMes * mesesDelAnio * tarifainternaporhora;
          const egresosTotales =
            -1 *
            horasOperativasMes *
            mesesDelAnio *
            (gastodemantenimiento + gastosgenerales + seguroTrecSeleccionado);

          // Obtener interés de amortización para este año
          const amortizacionAnio =
            tablaAmortizacionAnual &&
            tablaAmortizacionAnual.tablaAnual &&
            tablaAmortizacionAnual.tablaAnual[index]
              ? tablaAmortizacionAnual.tablaAnual[index]
              : null;
          const interesAmortizacion = amortizacionAnio
            ? -amortizacionAnio.interesAnual
            : 0;

          const baseImponible =
            ingresosTotales +
            egresosTotales +
            interesAmortizacion +
            depreciacionAnualAjustada;
          const impuestos =
            baseImponible > 0 ? -1 * (baseImponible * tasaImpuestos) : 0;

          flujoCajaOperacion = ingresosTotales + egresosTotales + impuestos;
        }

        // (-) DEPRECIACIÓN: Aplicar en todos los años operativos (ajustada para último año)
        const depreciacion =
          anioActual <= aniosParaEscenarios ? depreciacionAnualAjustada : 0;

        // (-) ENAJENACIÓN: Valor residual en negativo en el año correspondiente
        const enajenacion =
          anioActual === anioValorResidual ? -valorComercialReal : 0;

        // (+) VENTA: Valor comercial real en positivo en el año correspondiente
        const venta = anioActual === anioValorResidual ? valorComercialReal : 0;

        // FLUJO DE CAJA DE FINANCIAMIENTO: Intereses por financiamiento
        let flujoCajaFinanciamiento = 0;
        if (anioActual <= aniosParaEscenarios) {
          const datosAmortizacion =
            tablaAmortizacionAnual &&
            tablaAmortizacionAnual.tablaAnual &&
            tablaAmortizacionAnual.tablaAnual.find(
              (anio: any) => anio.anio === anioActual,
            );
          if (datosAmortizacion) {
            flujoCajaFinanciamiento = -datosAmortizacion.interesAnual; // Solo intereses (negativo)
          }
        }

        // ESTADO DE RESULTADOS: Suma de todos los componentes
        const estadoResultados =
          flujoCajaOperacion +
          depreciacion +
          enajenacion +
          venta +
          flujoCajaFinanciamiento;

        return {
          anio: anioActual,
          nombre: `Año ${anioActual}`,
          flujoCajaOperacion,
          depreciacion,
          enajenacion,
          venta,
          flujoCajaFinanciamiento,
          estadoResultados,
        };
      },
    );

    // Calcular totales (sumas horizontales)
    const totalFlujoCajaOperacion = aniosEstadoResultados.reduce(
      (sum, anio) => sum + anio.flujoCajaOperacion,
      0,
    );
    const totalDepreciacion = aniosEstadoResultados.reduce(
      (sum, anio) => sum + anio.depreciacion,
      0,
    );
    const totalEnajenacion = aniosEstadoResultados.reduce(
      (sum, anio) => sum + anio.enajenacion,
      0,
    );
    const totalVenta = aniosEstadoResultados.reduce(
      (sum, anio) => sum + anio.venta,
      0,
    );
    const totalFlujoCajaFinanciamiento = aniosEstadoResultados.reduce(
      (sum, anio) => sum + anio.flujoCajaFinanciamiento,
      0,
    );
    const totalEstadoResultados = aniosEstadoResultados.reduce(
      (sum, anio) => sum + anio.estadoResultados,
      0,
    );

    const estadoResultados = {
      concepto: 'ESTADO DE RESULTADOS',
      descripcion: 'Depreciación, enajenación y venta de activos',
      aniosMaximos,
      anioValorResidual,

      // Años del estado de resultados
      aniosOperativos: aniosEstadoResultados,

      // Resumen de totales (sumas horizontales)
      resumen: {
        totalFlujoCajaOperacion,
        totalDepreciacion,
        totalEnajenacion,
        totalVenta,
        totalFlujoCajaFinanciamiento,
        totalEstadoResultados,
        descripcionComponentes: {
          depreciacion: `Depreciación anual por ${aniosParaEscenarios} años`,
          enajenacion: `Enajenación (valor residual negativo) en año ${anioValorResidual}`,
          venta: `Venta (valor comercial real positivo) en año ${anioValorResidual}`,
          financiamiento: `Intereses por financiamiento durante ${aniosParaEscenarios} años`,
        },
      },
    };

    console.log(`[FLUJO-CAJA] ========== ESTADO DE RESULTADOS ==========`);
    console.log(
      `[FLUJO-CAJA] TOTAL Flujo Caja Operación: $${totalFlujoCajaOperacion.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Depreciación: $${totalDepreciacion.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Enajenación: $${totalEnajenacion.toLocaleString()}`,
    );
    console.log(`[FLUJO-CAJA] TOTAL Venta: $${totalVenta.toLocaleString()}`);
    console.log(
      `[FLUJO-CAJA] TOTAL Flujo Caja Financiamiento: $${totalFlujoCajaFinanciamiento.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] TOTAL Estado de Resultados: $${totalEstadoResultados.toLocaleString()}`,
    );

    // Log detallado por años
    aniosEstadoResultados.forEach((anio) => {
      console.log(`[FLUJO-CAJA] ${anio.nombre}:`);
      console.log(
        `  - Flujo Operación: $${anio.flujoCajaOperacion.toLocaleString()}`,
      );
      console.log(`  - Depreciación: $${anio.depreciacion.toLocaleString()}`);
      console.log(`  - Enajenación: $${anio.enajenacion.toLocaleString()}`);
      console.log(`  - Venta: $${anio.venta.toLocaleString()}`);
      console.log(
        `  - Flujo Financiamiento: $${anio.flujoCajaFinanciamiento.toLocaleString()}`,
      );
      console.log(
        `  - Estado Resultados: $${anio.estadoResultados.toLocaleString()}`,
      );
    });

    console.log(`[FLUJO-CAJA] ===============================================`);

    return estadoResultados;
  }

  /**
   * Agrega cálculos de VAN y TIR al reporte final consolidado
   * @param reporteConsolidado - Reporte consolidado base
   * @param valorAdquisicion - Valor de adquisición (inversión inicial)
   * @param tasaDescuento - Tasa de descuento de la empresa
   * @returns Reporte con análisis financiero agregado
   */
  private agregarAnalisisFinanciero(
    reporteConsolidado: any,
    valorAdquisicion: number,
    tasaDescuento: number,
  ): any {
    console.log(`[FLUJO-CAJA] ========== CALCULANDO VAN Y TIR ==========`);
    console.log(
      `[FLUJO-CAJA] Inversión inicial: $${valorAdquisicion.toLocaleString()}`,
    );
    console.log(
      `[FLUJO-CAJA] Tasa descuento empresa: ${(tasaDescuento * 100).toFixed(1)}%`,
    );

    // Preparar flujos de caja: [inversión_inicial, flujo_año1, flujo_año2, ...]
    const flujosCaja = this.prepararFlujosCajaParaAnalisis(
      reporteConsolidado,
      valorAdquisicion,
    );

    console.log(`[FLUJO-CAJA] Flujos de caja preparados:`, flujosCaja);

    // Calcular VAN (sin inversión inicial)
    const van = this.calcularVAN(flujosCaja, tasaDescuento);
    const vanInterpretacion =
      van > 0
        ? 'PROYECTO RENTABLE'
        : van < 0
          ? 'PROYECTO NO RENTABLE'
          : 'PROYECTO INDIFERENTE';

    // Calcular TIR
    const tir = this.calcularTIR(flujosCaja);
    const tirInterpretacion =
      tir > tasaDescuento * 100
        ? 'PROYECTO ATRACTIVO'
        : 'PROYECTO NO ATRACTIVO';

    // Calcular VAN TOTAL (incluyendo inversión inicial)
    // Equivalentemente: VAN_TOTAL = (-valorAdquisicion) + VAN_resultante_desc.
    const vanTotal = -valorAdquisicion + van;

    // Calcular RATIO B/C (Benefit-Cost Ratio)
    const ratioBeneficioCosto =
      valorAdquisicion > 0 ? 1 + van / valorAdquisicion : 0;
    const ratioBCInterpretacion =
      ratioBeneficioCosto > 1
        ? 'BENEFICIO SUPERA AL COSTO'
        : ratioBeneficioCosto < 1
          ? 'COSTO SUPERA AL BENEFICIO'
          : 'BENEFICIO IGUAL AL COSTO';

    // Calcular ROI (Return on Investment)
    const totalCajaResultante = flujosCaja.reduce(
      (sum, flujo) => sum + flujo,
      0,
    );
    const roi =
      valorAdquisicion > 0 ? (totalCajaResultante / valorAdquisicion) * 100 : 0;
    const roiInterpretacion =
      roi > 0
        ? 'RETORNO POSITIVO'
        : roi < 0
          ? 'RETORNO NEGATIVO'
          : 'RETORNO NEUTRO';

    // Calcular PAYBACK (Periodo de Recuperación)
    // PAYBACK = momento cuando flujo acumulado pasa de negativo a positivo
    let payback = 0;
    let flujoAcumulado = 0;
    let anioRecuperacion = -1;
    let flujoAcumuladoAnterior = 0;

    console.log(`[FLUJO-CAJA] ========== CÁLCULO PAYBACK ==========`);
    console.log(
      `[FLUJO-CAJA] Buscando cuándo flujo acumulado se vuelve positivo`,
    );

    for (let i = 0; i < flujosCaja.length; i++) {
      flujoAcumuladoAnterior = flujoAcumulado;
      flujoAcumulado += flujosCaja[i];

      console.log(
        `[FLUJO-CAJA] Año ${i + 1}: Flujo=${flujosCaja[i].toLocaleString()}, Acumulado=${flujoAcumulado.toLocaleString()}`,
      );

      // Buscar cuándo el flujo acumulado pasa de negativo a positivo
      if (
        flujoAcumuladoAnterior < 0 &&
        flujoAcumulado >= 0 &&
        anioRecuperacion === -1
      ) {
        anioRecuperacion = i + 1; // Año donde se vuelve positivo

        // Aplicar fórmula de Excel: (N-1) + (-FlujoPrevio/FlujoActual)
        // FlujoPrevio es negativo, por eso se pone negativo en la fórmula
        const flujoDelAnio = flujosCaja[i];
        const fraccionAnio =
          flujoDelAnio > 0
            ? Math.abs(flujoAcumuladoAnterior) / flujoDelAnio
            : 0;
        payback = anioRecuperacion - 1 + fraccionAnio;

        console.log(
          `[FLUJO-CAJA] PAYBACK encontrado en año ${anioRecuperacion}:`,
        );
        console.log(
          `[FLUJO-CAJA] - Flujo acumulado anterior: ${flujoAcumuladoAnterior.toLocaleString()}`,
        );
        console.log(
          `[FLUJO-CAJA] - Flujo del año ${anioRecuperacion}: ${flujoDelAnio.toLocaleString()}`,
        );
        console.log(
          `[FLUJO-CAJA] - Fracción: ${Math.abs(flujoAcumuladoAnterior).toLocaleString()} / ${flujoDelAnio.toLocaleString()} = ${fraccionAnio.toFixed(4)}`,
        );
        console.log(
          `[FLUJO-CAJA] - Cálculo: (${anioRecuperacion}-1) + ${fraccionAnio.toFixed(4)} = ${payback.toFixed(2)} años`,
        );
        break;
      }
    }

    // Si no se recupera en el periodo analizado (flujo sigue negativo)
    if (anioRecuperacion === -1) {
      payback = flujosCaja.length; // Más de los años analizados
      console.log(
        `[FLUJO-CAJA] PAYBACK: No se recupera, flujo final acumulado: ${flujoAcumulado.toLocaleString()}`,
      );
    }

    const paybackInterpretacion =
      anioRecuperacion !== -1
        ? `SE RECUPERA EN ${payback.toFixed(2)} AÑOS`
        : 'NO SE RECUPERA EN EL PERIODO ANALIZADO';

    console.log(
      `[FLUJO-CAJA] PAYBACK FINAL: ${payback.toFixed(2)} años (${paybackInterpretacion})`,
    );

    console.log(
      `[FLUJO-CAJA] VAN calculado: $${van.toLocaleString()} (${vanInterpretacion})`,
    );
    console.log(
      `[FLUJO-CAJA] TIR calculado: ${tir.toFixed(2)}% (${tirInterpretacion})`,
    );
    console.log(
      `[FLUJO-CAJA] RATIO B/C calculado: ${ratioBeneficioCosto.toFixed(4)} (${ratioBCInterpretacion})`,
    );
    console.log(
      `[FLUJO-CAJA] ROI calculado: ${roi.toFixed(2)}% (${roiInterpretacion})`,
    );
    console.log(
      `[FLUJO-CAJA] PAYBACK calculado: ${payback.toFixed(2)} años (${paybackInterpretacion})`,
    );
    console.log(`[FLUJO-CAJA] ========================================`);

    // Agregar sección de análisis financiero al reporte
    const reporteConAnalisis = {
      ...reporteConsolidado,

      // Agregar nueva sección de análisis financiero
      analisisFinanciero: {
        concepto: 'ANÁLISIS FINANCIERO DEL FLUJO DE CAJA RESULTANTE',
        descripcion:
          'VAN y TIR calculados SOLO sobre los flujos de caja resultantes anuales (SIN inversión inicial)',
        parametros: {
          inversionInicialExcluida: valorAdquisicion,
          tasaDescuentoEmpresa: tasaDescuento,
          totalAniosAnalisis: reporteConsolidado.aniosOperativos?.length || 0,
          nota: 'La inversión inicial NO se considera en los cálculos',
        },
        flujosCajaUtilizados: {
          descripcion:
            'Flujos utilizados para el cálculo: [Flujo_Año1, Flujo_Año2, ...] - SIN inversión inicial',
          valores: flujosCaja,
        },
        van: {
          valor: van,
          interpretacion: vanInterpretacion,
          formula:
            'VAN = Σ[Flujo_t / (1 + tasa_descuento)^t] donde t = 1, 2, 3... (SIN inversión inicial)',
          criterio:
            van > 0
              ? 'VAN > 0: Flujos generan valor presente positivo'
              : van < 0
                ? 'VAN < 0: Flujos generan valor presente negativo'
                : 'VAN = 0: Flujos tienen valor presente neutro',
        },
        vanTotal: {
          valor: vanTotal,
          interpretacion:
            vanTotal > 0
              ? 'VAN TOTAL POSITIVO (incluye inversión inicial)'
              : vanTotal < 0
                ? 'VAN TOTAL NEGATIVO (incluye inversión inicial)'
                : 'VAN TOTAL NEUTRO',
          formula:
            'VAN_TOTAL = (-Inversión) + Σ[Flujo_t/(1+tasa_descuento)^t], t = 1..n',
          criterio:
            vanTotal > 0
              ? 'Proyecto crea valor NPV positivo considerando inversión'
              : vanTotal < 0
                ? 'Proyecto destruye valor NPV considerando inversión'
                : 'Indiferente',
        },
        tir: {
          valor: tir, // Porcentaje
          interpretacion: tirInterpretacion,
          formula: 'TIR es la tasa donde VAN = 0',
          criterio: `TIR ${tir > tasaDescuento * 100 ? '>' : '≤'} Tasa_Descuento (${(tasaDescuento * 100).toFixed(1)}%): ${tirInterpretacion}`,
        },
        ratioBeneficioCosto: {
          valor: ratioBeneficioCosto,
          interpretacion: ratioBCInterpretacion,
          formula: 'RATIO B/C = 1 + VAN/VALOR_DEL_ACTIVO',
          criterio:
            ratioBeneficioCosto > 1
              ? 'Ratio > 1: Los beneficios superan a los costos'
              : ratioBeneficioCosto < 1
                ? 'Ratio < 1: Los costos superan a los beneficios'
                : 'Ratio = 1: Los beneficios igualan a los costos',
        },
        roi: {
          valor: roi, // Porcentaje
          interpretacion: roiInterpretacion,
          formula: 'ROI = (TOTAL_CAJA_RESULTANTE/VALOR_DEL_ACTIVO) × 100',
          criterio:
            roi > 0
              ? `ROI > 0: Retorno positivo del ${roi.toFixed(2)}% sobre la inversión`
              : roi < 0
                ? `ROI < 0: Retorno negativo del ${Math.abs(roi).toFixed(2)}%`
                : 'ROI = 0: Retorno neutro sobre la inversión',
        },
        payback: {
          valor: payback, // Años (con decimales)
          interpretacion: paybackInterpretacion,
          formula:
            'PAYBACK = (N-1) + (|FLUJO_ACUMULADO_ANTERIOR|/FLUJO_DEL_AÑO_N)',
          formulaExcel:
            '=(N-1)+(-I57/J56) donde N=año recuperación, I57=flujo acum anterior, J56=flujo del año',
          criterio:
            anioRecuperacion !== -1
              ? `El flujo acumulado se vuelve positivo en ${payback.toFixed(2)} años`
              : `El flujo acumulado NO se vuelve positivo en el periodo de ${flujosCaja.length} años analizado`,
          detalleCalculo: {
            metodologia:
              'Busca cuándo el flujo acumulado pasa de negativo a positivo',
            anioRecuperacion:
              anioRecuperacion !== -1 ? anioRecuperacion : 'No aplica',
            flujoAcumuladoAnterior:
              anioRecuperacion !== -1 ? flujoAcumuladoAnterior : null,
            flujoDelAnioRecuperacion:
              anioRecuperacion !== -1 ? flujosCaja[anioRecuperacion - 1] : null,
            fraccionCalculada:
              anioRecuperacion !== -1
                ? Math.abs(flujoAcumuladoAnterior) /
                  flujosCaja[anioRecuperacion - 1]
                : null,
            calculoCompleto:
              anioRecuperacion !== -1
                ? `(${anioRecuperacion}-1) + (${Math.abs(flujoAcumuladoAnterior).toFixed(2)}/${flujosCaja[anioRecuperacion - 1].toFixed(2)}) = ${payback.toFixed(2)} años`
                : 'No aplica',
            flujosPorAnio: flujosCaja.map((flujo, index) => ({
              anio: index + 1,
              flujo: flujo,
              acumulado: flujosCaja
                .slice(0, index + 1)
                .reduce((sum, f) => sum + f, 0),
            })),
          },
        },
        conclusion: {
          recomendacion:
            van > 0 && tir > tasaDescuento * 100 && ratioBeneficioCosto > 1
              ? 'PROYECTO ALTAMENTE FAVORABLE: Todos los indicadores son positivos'
              : van > 0 &&
                  (tir > tasaDescuento * 100 || ratioBeneficioCosto > 1)
                ? 'PROYECTO FAVORABLE: La mayoría de indicadores son positivos'
                : van <= 0 || tir <= tasaDescuento * 100
                  ? 'PROYECTO DESFAVORABLE: Los indicadores requieren análisis adicional'
                  : 'PROYECTO REQUIERE ANÁLISIS ADICIONAL',
          valorEconomico:
            van > 0
              ? `Los flujos anuales generan un valor presente de $${van.toLocaleString()}`
              : `Los flujos anuales tienen un valor presente negativo de $${Math.abs(van).toLocaleString()}`,
          rendimiento: `Los flujos anuales ofrecen un rendimiento equivalente del ${tir.toFixed(2)}% anual`,
          rentabilidad: `ROI del ${roi.toFixed(2)}% sobre la inversión de $${valorAdquisicion.toLocaleString()}`,
          recuperacion: paybackInterpretacion,
          eficiencia: `Ratio Beneficio/Costo de ${ratioBeneficioCosto.toFixed(4)} (${ratioBCInterpretacion.toLowerCase()})`,
          resumenIndicadores: {
            van: `$${van.toLocaleString()}`,
            tir: `${tir.toFixed(2)}%`,
            ratioBc: ratioBeneficioCosto.toFixed(4),
            roi: `${roi.toFixed(2)}%`,
            payback: `${payback.toFixed(2)} años`,
          },
          aclaracion:
            'Análisis basado ÚNICAMENTE en flujos de caja anuales (SIN considerar inversión inicial)',
        },
      },
    };

    return reporteConAnalisis;
  }

  /**
   * Determina el año en que se debe registrar el valor residual.
   * Lógica basada en la parte decimal:
   * - Si decimal < 0.5 → parteEntera + 1
   * - Si decimal >= 0.5 → parteEntera + 2
   * Ejemplos: 3.03→4, 3.5→5, 4.3→5, 4.5→6, 4.6→6, 5.0→6
   * @param aniosOperacionEstimados - Vida útil estimada del activo en años.
   * @returns El año (entero) en el que se debe contabilizar el valor residual.
   */
  private _determinarAnioValorResidual(
    aniosOperacionEstimados: number,
  ): number {
    if (aniosOperacionEstimados <= 0) {
      return 1; // Por defecto, si no hay vida útil, se considera en el primer año.
    }

    const parteEntera = Math.floor(aniosOperacionEstimados);
    const parteDecimal = aniosOperacionEstimados - parteEntera;

    if (parteDecimal < 0.5) {
      // Decimal menor a 0.5: sumar 1 año
      return parteEntera + 1;
    } else {
      // Decimal mayor o igual a 0.5: sumar 2 años
      return parteEntera + 2;
    }
  }

  /**
   * ENDPOINT 1: Obtener parámetros de amortización para nueva máquina
   * Usa el ÚLTIMO informe de costo horario de la máquina para obtener los parámetros clave
   * que el frontend necesita para construir la tabla de amortización completa
   */
  async obtenerParametrosAmortizacion(machineId: number): Promise<any> {
    console.log(
      `[AMORTIZACIÓN] Obteniendo parámetros para máquina ${machineId}`,
    );

    // 1. Obtener máquina con datos completos
    const machine = await this.prisma.machines.findUnique({
      where: { id: machineId },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
          },
        },
      },
    });

    if (!machine) {
      throw new NotFoundException(`Máquina con ID ${machineId} no encontrada`);
    }

    // 2. Obtener último informe de costo horario
    const informeCostoHorario =
      await this.getUltimoInformeCostoHorario(machineId);

    const informeData = informeCostoHorario.resultado_completo_json as any;

    // 3. Extraer parámetros clave
    const capital = Number(machine.valor_similar_nuevo) || 0;
    const tasaAnual = Number(
      informeCostoHorario.tasa_financiamiento_usada || 0,
    );
    const aniosFinanciamiento = Number(
      informeCostoHorario.anios_financiamiento || 0,
    );
    const mesesPorAnio = Number(
      informeCostoHorario.mes_por_anio ||
        informeData?.parametros?.mesesPorAnio ||
        12,
    );

    // 4. Validar que hay financiamiento
    if (capital <= 0 || tasaAnual <= 0 || aniosFinanciamiento <= 0) {
      return serializeBigInt({
        machine: {
          id: Number(machine.id),
          marca: machine.modelo?.marca?.nombre || null,
          modelo: machine.modelo?.nombre || null,
          estado: machine.estado,
        },
        informeOrigen: {
          id: Number(informeCostoHorario.id),
          fechaCalculo: informeCostoHorario.fecha_calculo,
        },
        sinFinanciamiento: true,
        mensaje: 'No hay datos de financiamiento para esta máquina',
        parametrosAmortizacion: null,
      });
    }

    // 5. Calcular TEA y cuota mensual
    const tea = Math.pow(1 + tasaAnual, 1 / mesesPorAnio) - 1;
    const totalPeriodos = mesesPorAnio * aniosFinanciamiento;
    const denominador = 1 - Math.pow(1 + tea, -totalPeriodos);
    const cuotaMensual = (capital * tea) / denominador;

    console.log(`[AMORTIZACIÓN] Capital: $${capital.toLocaleString()}`);
    console.log(`[AMORTIZACIÓN] Tasa anual: ${(tasaAnual * 100).toFixed(2)}%`);
    console.log(`[AMORTIZACIÓN] TEA mensual: ${(tea * 100).toFixed(3)}%`);
    console.log(`[AMORTIZACIÓN] Cuota mensual: $${cuotaMensual.toFixed(2)}`);

    // 6. Construir response
    return serializeBigInt({
      machine: {
        id: Number(machine.id),
        marca: machine.modelo?.marca?.nombre || null,
        modelo: machine.modelo?.nombre || null,
        estado: machine.estado,
        idEquipo: machine.id_equipo_interno,
      },
      informeOrigen: {
        id: Number(informeCostoHorario.id),
        fechaCalculo: informeCostoHorario.fecha_calculo,
      },
      parametrosAmortizacion: {
        capital: Number(capital.toFixed(2)),
        tasaAnual: Number(tasaAnual.toFixed(6)),
        tasaMensual: Number(tea.toFixed(6)),
        mesesPorAnio: mesesPorAnio,
        aniosFinanciamiento: aniosFinanciamiento,
        totalPeriodos: totalPeriodos,
        cuotaMensual: Number(cuotaMensual.toFixed(2)),
      },
      formulasExcel: {
        tea: '=POTENCIA(1 + tasaAnual, 1/mesesPorAnio) - 1',
        cuotaMensual:
          '=(capital * tea) / (1 - POTENCIA(1 + tea, -totalPeriodos))',
        interesMensual: '=saldoPendiente * tea',
        capitalMensual: '=cuotaMensual - interesMensual',
      },
    });
  }

  /**
   * ENDPOINT 2: Obtener parámetros de amortización de un reporte guardado
   * Usa los valores EXACTOS que se guardaron en ese análisis de flujo específico
   */
  async obtenerParametrosAmortizacionReporte(
    flujoHistorialId: number,
  ): Promise<any> {
    console.log(
      `[AMORTIZACIÓN] Obteniendo parámetros de reporte ${flujoHistorialId}`,
    );

    // 1. Buscar el registro de flujo historial
    const flujoHistorial = await this.prisma.flujoHistorial.findUnique({
      where: { id: flujoHistorialId },
      include: {
        machines: {
          include: {
            modelo: {
              include: {
                marca: true,
                equipo: true,
              },
            },
          },
        },
      },
    });

    if (!flujoHistorial) {
      throw new NotFoundException(
        `Análisis de flujo con ID ${flujoHistorialId} no encontrado`,
      );
    }

    // 2. Extraer datos precargados del JSON
    const otrosDatos = flujoHistorial.otros_datos_json as any;
    const datosPrecargados = otrosDatos?.datosPrecargados;

    if (!datosPrecargados || !datosPrecargados.informeOrigen) {
      throw new NotFoundException(
        `No se encontraron datos de amortización en el análisis ${flujoHistorialId}`,
      );
    }

    // 3. Extraer parámetros EXACTOS que se usaron
    const capital = Number(datosPrecargados.valorAdquisicion || 0);
    const tasaAnual = Number(
      datosPrecargados.informeOrigen.tasaFinanciamiento || 0,
    );
    const aniosFinanciamiento = Number(
      datosPrecargados.informeOrigen.aniosFinanciamiento || 0,
    );
    const mesesPorAnio = Number(datosPrecargados.mesesAlAnio || 12);

    // 4. Validar que había financiamiento
    if (capital <= 0 || tasaAnual <= 0 || aniosFinanciamiento <= 0) {
      return serializeBigInt({
        flujoHistorial: {
          id: Number(flujoHistorial.id),
          fechaCalculo: flujoHistorial.fecha_calculo,
          machine: {
            id: Number(flujoHistorial.machines.id),
            marca: flujoHistorial.machines.modelo?.marca?.nombre || null,
            modelo: flujoHistorial.machines.modelo?.nombre || null,
          },
        },
        sinFinanciamiento: true,
        mensaje: 'Este análisis no incluía financiamiento',
        parametrosAmortizacion: null,
      });
    }

    // 5. Calcular TEA y cuota (mismos valores que se usaron originalmente)
    const tea = Math.pow(1 + tasaAnual, 1 / mesesPorAnio) - 1;
    const totalPeriodos = mesesPorAnio * aniosFinanciamiento;
    const denominador = 1 - Math.pow(1 + tea, -totalPeriodos);
    const cuotaMensual = (capital * tea) / denominador;

    console.log(
      `[AMORTIZACIÓN] Reporte ${flujoHistorialId} - Parámetros usados:`,
    );
    console.log(`  - Capital: $${capital.toLocaleString()}`);
    console.log(`  - Tasa anual: ${(tasaAnual * 100).toFixed(2)}%`);
    console.log(`  - Años: ${aniosFinanciamiento}`);
    console.log(`  - Cuota mensual: $${cuotaMensual.toFixed(2)}`);

    // 6. Construir response
    return serializeBigInt({
      flujoHistorial: {
        id: Number(flujoHistorial.id),
        fechaCalculo: flujoHistorial.fecha_calculo,
        machine: {
          id: Number(flujoHistorial.machines.id),
          marca: flujoHistorial.machines.modelo?.marca?.nombre || null,
          modelo: flujoHistorial.machines.modelo?.nombre || null,
          estado: flujoHistorial.machines.estado,
        },
      },
      informeOrigenUsado: {
        id: Number(datosPrecargados.informeOrigen.id),
        fechaCalculo: datosPrecargados.informeOrigen.fechaCalculo,
      },
      parametrosAmortizacion: {
        capital: Number(capital.toFixed(2)),
        tasaAnual: Number(tasaAnual.toFixed(6)),
        tasaMensual: Number(tea.toFixed(6)),
        mesesPorAnio: mesesPorAnio,
        aniosFinanciamiento: aniosFinanciamiento,
        totalPeriodos: totalPeriodos,
        cuotaMensual: Number(cuotaMensual.toFixed(2)),
      },
      formulasExcel: {
        tea: '=POTENCIA(1 + tasaAnual, 1/mesesPorAnio) - 1',
        cuotaMensual:
          '=(capital * tea) / (1 - POTENCIA(1 + tea, -totalPeriodos))',
        interesMensual: '=saldoPendiente * tea',
        capitalMensual: '=cuotaMensual - interesMensual',
      },
      nota: 'Estos son los parámetros EXACTOS usados en el análisis guardado',
    });
  }
}
