import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ModeloComponentesHistoricoService } from '../../gestion-activos/modelo_componentes_historico/modelo-componentes-historico.service';
import { PosesionService } from '../posesion/posesion.service';
import { CreateInformeCostoHorarioDto } from './dto/create-informe-costo-horario.dto';

@Injectable()
export class InformeCostoHorarioService {
  constructor(
    private prisma: PrismaService,
    private modeloComponentesHistoricoService: ModeloComponentesHistoricoService,
    private posesionService: PosesionService,
  ) {}

  // Obtiene los ratios vigentes (último por tipo) para el modelo de la máquina
  private async getRatiosPorModelo(modeloId: number) {
    const ratios = await this.prisma.ratiosHistorico.findMany({
      where: { modelo_id: modeloId },
      include: { tipo_ratio: true },
      orderBy: { fecha_efectiva: 'desc' },
    });

    // Mantener solo el más reciente por tipo_ratio_id
    const latestByTipoId = new Map<number, (typeof ratios)[number]>();
    for (const r of ratios) {
      if (!latestByTipoId.has(r.tipo_ratio_id)) {
        latestByTipoId.set(r.tipo_ratio_id, r);
      }
    }

    // Mapa por nombre normalizado
    const nombreToValor: Record<string, number> = {};
    for (const r of latestByTipoId.values()) {
      const key = r.tipo_ratio.nombre.trim().toLowerCase();
      nombreToValor[key] = r.valor ?? 0;
      console.log(`[DEBUG] Ratio encontrado: "${key}" = ${r.valor ?? 0}`);
    }

    // Extraer valores con llaves estándar usadas en el JSON
    const map = {
      lubricantes: nombreToValor['lubricantes'] || 0,
      filtros: nombreToValor['filtros'] || 0,
      materialesFerreteria: nombreToValor['materiales de ferreteria'] || 0,
      materialesElectricos: nombreToValor['materiales electricos'] || 0,
      mangueras: nombreToValor['mangueras'] || 0,
      menores: nombreToValor['menores'] || 0,
      mayores: nombreToValor['mayores'] || 0,
      neumaticos: nombreToValor['neumaticos'] || 0,
      estructural:
        nombreToValor['estructural'] ||
        nombreToValor['soldadura'] ||
        nombreToValor['soldaduras'] ||
        nombreToValor['correctivo'] ||
        0,
      desgaste:
        nombreToValor['desgaste'] ||
        nombreToValor['gets'] ||
        nombreToValor['get'] ||
        nombreToValor['elementos de desgaste'] ||
        nombreToValor['desgastes'] ||
        0,
    };

    console.log(`[DEBUG] 🎯 Valores finales mapeados:`);
    console.log(
      `[DEBUG] - Estructural: ${map.estructural} (buscó: 'estructural', 'soldadura', 'soldaduras', 'correctivo')`,
    );
    console.log(
      `[DEBUG] - Desgaste: ${map.desgaste} (buscó: 'desgaste', 'gets', 'get', 'elementos de desgaste', 'desgastes')`,
    );

    return { map, raw: ratios };
  }

  // Obtiene los componentes históricos por modelo y los mapea a valores específicos
  private async getComponentesPorModelo(modeloId: number) {
    console.log(`[DEBUG] Obteniendo componentes para modelo ID: ${modeloId}`);

    const componentesHistorico =
      await this.modeloComponentesHistoricoService.getLatestByModelo(modeloId);

    console.log(
      `[DEBUG] Componentes históricos obtenidos:`,
      JSON.stringify(componentesHistorico, null, 2),
    );

    // Mapear por IDs específicos según la BD real (1-7)
    const componentesMap: Record<string, number> = {
      motor: 0, // ID 1: Motor
      transmision: 0, // ID 2: Transmisión
      convertidor: 0, // ID 3: Convertidor
      mandosFinales: 0, // ID 4: Mandos finales y freno diferenciales
      diferenciales: 0, // ID 5: diferenciales
      sistemaHidraulico: 0, // ID 6: Sistema hidráulico
      sistemaElectrico: 0, // ID 7: Sistema Eléctrico
    };

    for (const comp of componentesHistorico) {
      const componenteId = comp.componente.id;
      const montoAplicado = Number(comp.monto_aplicado_al_proyecto) || 0;

      console.log(
        `[DEBUG] Procesando componente ID: ${componenteId}, Nombre: "${comp.componente.nombre}"`,
      );
      console.log(`[DEBUG] Monto aplicado: ${montoAplicado}`);

      // Mapear por ID exacto
      switch (componenteId) {
        case 1: // Motor
          console.log(`[DEBUG] ✓ Mapeado como MOTOR: ${montoAplicado}`);
          componentesMap.motor = montoAplicado;
          break;
        case 2: // Transmisión
          console.log(`[DEBUG] ✓ Mapeado como TRANSMISION: ${montoAplicado}`);
          componentesMap.transmision = montoAplicado;
          break;
        case 3: // Convertidor
          console.log(`[DEBUG] ✓ Mapeado como CONVERTIDOR: ${montoAplicado}`);
          componentesMap.convertidor = montoAplicado;
          break;
        case 4: // Mandos finales y freno diferenciales
          console.log(
            `[DEBUG] ✓ Mapeado como MANDOS FINALES: ${montoAplicado}`,
          );
          componentesMap.mandosFinales = montoAplicado;
          break;
        case 5: // diferenciales
          console.log(`[DEBUG] ✓ Mapeado como DIFERENCIALES: ${montoAplicado}`);
          componentesMap.diferenciales = montoAplicado;
          break;
        case 6: // Sistema hidráulico
          console.log(
            `[DEBUG] ✓ Mapeado como SISTEMA HIDRAULICO: ${montoAplicado}`,
          );
          componentesMap.sistemaHidraulico = montoAplicado;
          break;
        case 7: // Sistema Eléctrico
          console.log(
            `[DEBUG] ✓ Mapeado como SISTEMA ELECTRICO: ${montoAplicado}`,
          );
          componentesMap.sistemaElectrico = montoAplicado;
          break;
        default:
          console.log(
            `[DEBUG] ✗ NO MAPEADO: ID ${componenteId} "${comp.componente.nombre}" no está en el mapeo configurado`,
          );
      }
    }

    console.log(`[DEBUG] Mapa final de componentes:`, componentesMap);
    return { componentesMap, raw: componentesHistorico };
  }

  private simpleDepreciacionHoraria(
    depreciacionRealTotal: number,
    horasUsoAnual: number,
  ) {
    if (horasUsoAnual <= 0) return 0;
    return depreciacionRealTotal / horasUsoAnual;
  }

  private simpleFinanciamientoHoraria(
    valorSimilarNuevo: number,
    tasa: number,
    horasUsoAnual: number,
    mesesPorAnio: number = 12,
    aniosFinanciamiento: number = 1,
  ) {
    if (horasUsoAnual <= 0) return 0;

    console.log(`[DEBUG] ===== CÁLCULO DE AMORTIZACIÓN =====`);
    console.log(
      `[DEBUG] Capital (Valor Similar Nuevo): $${valorSimilarNuevo.toLocaleString()}`,
    );
    console.log(
      `[DEBUG] Tasa Financiamiento Anual: ${(tasa * 100).toFixed(4)}%`,
    );
    console.log(`[DEBUG] Meses por Año: ${mesesPorAnio}`);
    console.log(`[DEBUG] Años Financiamiento: ${aniosFinanciamiento}`);
    console.log(`[DEBUG] Horas Uso Anual: ${horasUsoAnual}`);

    // Usar la función de amortización para calcular el costo total
    const amortizacion = this.calcularAmortizacion(
      valorSimilarNuevo,
      tasa,
      mesesPorAnio,
      aniosFinanciamiento,
    );

    console.log(`[DEBUG] ----- RESULTADOS AMORTIZACIÓN -----`);
    console.log(
      `[DEBUG] TEA (Tasa Efectiva Mensual): ${(amortizacion.tea * 100).toFixed(6)}%`,
    );
    console.log(
      `[DEBUG] Períodos Total: ${mesesPorAnio * aniosFinanciamiento} meses`,
    );
    console.log(
      `[DEBUG] Cuota Mensual: $${amortizacion.cuotaMensual.toLocaleString()}`,
    );
    console.log(
      `[DEBUG] Total Capital: $${amortizacion.totalCapital.toLocaleString()}`,
    );
    console.log(
      `[DEBUG] Total Interés: $${amortizacion.totalInteres.toLocaleString()}`,
    );
    console.log(
      `[DEBUG] Total Cuotas: $${amortizacion.totalCuotas.toLocaleString()}`,
    );
    console.log(
      `[DEBUG] Suma Total (Capital + Interés): $${amortizacion.sumaTotal.toLocaleString()}`,
    );

    // Dividir la suma total entre las horas de uso anuales
    const costoHorario =
      amortizacion.sumaTotal / (horasUsoAnual * aniosFinanciamiento);

    console.log(`[DEBUG] ----- COSTO HORARIO -----`);
    console.log(
      `[DEBUG] Horas Totales (${horasUsoAnual} * ${aniosFinanciamiento}): ${horasUsoAnual * aniosFinanciamiento}`,
    );
    console.log(
      `[DEBUG] Costo Financiamiento por Hora: $${costoHorario.toFixed(4)}`,
    );
    console.log(`[DEBUG] =====================================`);

    return costoHorario;
  }

  private simpleSeguroHoraria(
    valorSimilarNuevo: number,
    tasaSeguro: number,
    horasUsoAnual: number,
  ) {
    if (horasUsoAnual <= 0) return 0;
    return (valorSimilarNuevo * (tasaSeguro || 0)) / horasUsoAnual; // placeholder simple
  }

  /**
   * Calcula el subtotal de costos variables
   * @param ratios - Objeto con todos los ratios
   * @param totalPptoPics - Total de PPTO PICs
   * @param horasUsoAnual - Horas de uso anuales
   * @returns Subtotal de costos variables
   */
  private calcularSubtotalVariable(
    ratios: {
      lubricantes: number;
      filtros: number;
      materialesFerreteria: number;
      materialesElectricos: number;
      mangueras: number;
      menores: number;
      mayores: number;
      neumaticos: number;
      soldaduraEstructuras: number;
      gets: number;
    },
    totalPptoPics: number,
    horasUsoAnual: number,
  ) {
    return (
      ratios.lubricantes +
      ratios.filtros +
      ratios.materialesFerreteria +
      ratios.materialesElectricos +
      ratios.mangueras +
      ratios.menores +
      totalPptoPics / horasUsoAnual +
      ratios.soldaduraEstructuras +
      ratios.neumaticos +
      ratios.gets
    );
  }

  /**
   * Calcula la amortización de un préstamo usando la fórmula francesa
   * @param capital - Valor similar nuevo (capital del préstamo)
   * @param tasaFinanciamientoAnual - Tasa de financiamiento anual
   * @param mesesPorAnio - Meses por año (normalmente 12)
   * @param aniosFinanciamiento - Años de financiamiento
   * @returns Objeto con totales de capital, interés, cuota y suma total
   */
  private calcularAmortizacion(
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
      console.log(`[DEBUG] ⚠️  Parámetros inválidos para amortización:`);
      console.log(
        `[DEBUG] Capital: ${capital}, Tasa: ${tasaFinanciamientoAnual}, Años: ${aniosFinanciamiento}`,
      );
      return {
        totalCapital: 0,
        totalInteres: 0,
        totalCuotas: 0,
        sumaTotal: 0,
        cuotaMensual: 0,
        tea: 0,
      };
    }

    // TEA: Tasa Efectiva Anual convertida a mensual
    // TEA = (1 + tasa_anual)^(1/12) - 1
    const tea = Math.pow(1 + tasaFinanciamientoAnual, 1 / mesesPorAnio) - 1;
    console.log(
      `[DEBUG] 📊 Cálculo TEA: (1 + ${tasaFinanciamientoAnual})^(1/${mesesPorAnio}) - 1 = ${tea}`,
    );

    // Número de períodos (meses)
    const periodos = mesesPorAnio * aniosFinanciamiento;
    console.log(
      `[DEBUG] 📅 Períodos: ${mesesPorAnio} × ${aniosFinanciamiento} = ${periodos} meses`,
    );

    // Cálculo de la cuota mensual usando la fórmula francesa
    // Pago = (Capital × TEA) / (1 - (1 + TEA)^(-periodos))
    const denominador = 1 - Math.pow(1 + tea, -periodos);
    const cuotaMensual = (capital * tea) / denominador;

    console.log(
      `[DEBUG] 💰 Fórmula cuota: (${capital} × ${tea}) / (1 - (1 + ${tea})^(-${periodos}))`,
    );
    console.log(`[DEBUG] 💰 Denominador: ${denominador}`);
    console.log(`[DEBUG] 💰 Cuota mensual: ${cuotaMensual}`);

    // Totales
    const totalCuotas = cuotaMensual * periodos;
    const totalInteres = totalCuotas - capital;
    const sumaTotal = capital + totalInteres; // Capital + Interés

    console.log(
      `[DEBUG] 📈 Total cuotas (${cuotaMensual} × ${periodos}): ${totalCuotas}`,
    );
    console.log(
      `[DEBUG] 📈 Total interés (${totalCuotas} - ${capital}): ${totalInteres}`,
    );
    console.log(
      `[DEBUG] 📈 Suma total (${capital} + ${totalInteres}): ${sumaTotal}`,
    );

    return {
      totalCapital: capital,
      totalInteres,
      totalCuotas,
      sumaTotal,
      cuotaMensual,
      tea,
    };
  }

  /**
   * Obtiene los escenarios desde un registro de posesión
   */
  private async getEscenariosFromPosesion(posesionId: number) {
    const posesionData =
      await this.posesionService.findHistorialById(posesionId);

    if (!posesionData || !posesionData.horas_json?.escenarios) {
      throw new NotFoundException(
        `No se encontraron escenarios en el registro de posesión con ID ${posesionId}`,
      );
    }

    // Mapear los escenarios de posesión al formato esperado
    return posesionData.horas_json.escenarios.map((escenario) => ({
      horasMinimas: escenario.horasMinimas,
      gradoOperatividad: escenario.gradoDeOperatividad,
      factorMercado: escenario.factorDeMercado,
    }));
  }

  async preview(dto: CreateInformeCostoHorarioDto) {
    const machine = await this.prisma.machines.findUnique({
      where: { id: dto.machineId },
      include: { modelo: { include: { marca: true, equipo: true } } },
    });
    if (!machine) throw new NotFoundException('Machine not found');

    // Obtener escenarios desde posesión
    const escenarios = await this.getEscenariosFromPosesion(dto.posesionId);

    const valorSimilarNuevo = Number(machine.valor_similar_nuevo);
    const valorResidual10 = valorSimilarNuevo * 0.1;
    const vidaUtilFabricante =
      machine.vida_util || machine.modelo?.vida_util_fabricante || 0;
    const depreciacionTeorica = valorSimilarNuevo - valorResidual10; // simple

    // Ratios históricos vinculados al modelo
    const { map: ratiosModelo, raw: ratiosRaw } = await this.getRatiosPorModelo(
      machine.modelo_id as number,
    );

    // Componentes históricos vinculados al modelo
    const { componentesMap, raw: componentesRaw } =
      await this.getComponentesPorModelo(machine.modelo_id as number);

    const escenariosCalculo = escenarios.map((esc) => {
      const horasUsoAnual = esc.horasMinimas * (dto.mesesPorAnio || 12);
      // Valor comercial teórico (simplificado): residual * grado
      const valorComercialTeorico = valorResidual10 * esc.gradoOperatividad; // placeholder
      const valorComercialReal = valorComercialTeorico * esc.factorMercado; // placeholder
      const porcentajeValorComercialReal =
        valorComercialReal / valorSimilarNuevo;
      const depreciacionReal = valorSimilarNuevo - valorComercialReal; // placeholder
      const depreciacionHoraria = this.simpleDepreciacionHoraria(
        depreciacionReal,
        horasUsoAnual,
      );
      const financiamientoHoraria = this.simpleFinanciamientoHoraria(
        valorSimilarNuevo,
        dto.tasaFinanciamiento || 0,
        horasUsoAnual,
        dto.mesesPorAnio || 12,
        dto.aniosFinanciamiento || 1,
      );
      const seguroHoraria = this.simpleSeguroHoraria(
        valorSimilarNuevo,
        dto.tasaSeguro || 0,
        horasUsoAnual,
      );
      const subtotalFijo =
        depreciacionHoraria + financiamientoHoraria + seguroHoraria;

      // Ratios variables (USD/HR) obtenidos desde BD (asumimos ya están en USD/hora)
      const ratios = {
        lubricantes: ratiosModelo.lubricantes,
        filtros: ratiosModelo.filtros,
        materialesFerreteria: ratiosModelo.materialesFerreteria,
        materialesElectricos: ratiosModelo.materialesElectricos,
        mangueras: ratiosModelo.mangueras,
        menores: ratiosModelo.menores,
        mayores: dto.costoMCorrMayores || 0, // Usar input del DTO en lugar de BD
        neumaticos: ratiosModelo.neumaticos,
        soldaduraEstructuras: ratiosModelo.estructural, // lo incluimos como "estructural"
        gets: ratiosModelo.desgaste,
      };
      const subtotalVariable =
        ratios.lubricantes +
        ratios.filtros +
        ratios.materialesFerreteria +
        ratios.materialesElectricos +
        ratios.mangueras +
        ratios.menores +
        ratios.mayores +
        ratios.neumaticos +
        ratios.soldaduraEstructuras +
        ratios.gets;

      const utilidadFija =
        subtotalFijo * (machine.modelo?.porcentaje_utilidad || 0);
      const utilidadVariable =
        subtotalVariable * (machine.modelo?.porcentaje_utilidad || 0);

      // Obtener datos de amortización para usar en la sección 3
      const amortizacionData = this.calcularAmortizacion(
        valorSimilarNuevo,
        dto.tasaFinanciamiento || 0,
        dto.mesesPorAnio || 12,
        dto.aniosFinanciamiento || 1,
      );

      // Calcular costos horarios para la sección 3 (posesión)
      const depreciacionHorariaPosesion = depreciacionReal / vidaUtilFabricante;
      const financiamientoHorariaPosesion =
        amortizacionData.totalInteres /
        ((dto.mesesPorAnio || 12) *
          (dto.aniosFinanciamiento || 1) *
          esc.horasMinimas);
      const seguroHorariaPosesion =
        (valorSimilarNuevo * (dto.tasaSeguro || 0)) /
        ((dto.mesesPorAnio || 12) * esc.horasMinimas);

      // Subtotal de posesión (suma de los tres componentes)
      const subtotalPosesion =
        depreciacionHorariaPosesion +
        financiamientoHorariaPosesion +
        seguroHorariaPosesion;

      // Utilidad sobre el subtotal de posesión
      const utilidadPosesion =
        subtotalPosesion * (machine.modelo?.porcentaje_utilidad || 0);

      // Cálculo total de PPTO PICs - solo la suma de los 7 componentes PICs (IDs 1-7)
      const totalPptoPics =
        (componentesMap.motor * ratios.mayores * horasUsoAnual) /
          vidaUtilFabricante +
        (componentesMap.transmision * ratios.mayores * horasUsoAnual) /
          vidaUtilFabricante +
        (componentesMap.convertidor * ratios.mayores * horasUsoAnual) /
          vidaUtilFabricante +
        (componentesMap.mandosFinales * ratios.mayores * horasUsoAnual) /
          vidaUtilFabricante +
        (componentesMap.diferenciales * ratios.mayores * horasUsoAnual) /
          vidaUtilFabricante +
        (componentesMap.sistemaHidraulico * ratios.mayores * horasUsoAnual) /
          vidaUtilFabricante +
        (componentesMap.sistemaElectrico * ratios.mayores * horasUsoAnual) /
          vidaUtilFabricante;

      // Calcular subtotal variable usando la función
      const subtotalVariableCalculado = this.calcularSubtotalVariable(
        ratios,
        totalPptoPics,
        horasUsoAnual,
      );

      // Utilidad sobre subtotal variable
      const utilidadVariableCalculada =
        subtotalVariableCalculado * (machine.modelo?.porcentaje_utilidad || 0);

      return {
        horasMinimas: esc.horasMinimas,
        gradoOperatividad: esc.gradoOperatividad,
        factorMercado: esc.factorMercado,
        horasUsoAnual,
        seccion1: {
          descripcion: {
            item: machine.id,
            equipo: machine.modelo?.equipo?.nombre || null,
            marca: machine.modelo?.marca?.nombre || null,
            modelo: machine.modelo?.nombre || null,
            horometroInicial: machine.horometro_inicial,
            estado: machine.estado,
            idEquipo: machine.id_equipo_interno,
          },
          operacion: {
            horasMinimas: esc.horasMinimas,
            politicaDepreciacionAnos: machine.politica_depreciacion,
            horasUsoAnual: esc.horasMinimas * 12,
          },
        },
        seccion2: {
          descripcion: {
            valorSimilarNuevo: valorSimilarNuevo,
            valorResidual10: valorResidual10,
            vidaUtilFabricante: vidaUtilFabricante,
            depreciacionTeorica: depreciacionTeorica,
            gradoOperatividad: esc.gradoOperatividad,
            valorComercialTeorico: valorComercialTeorico,
            factorMercado: esc.factorMercado,
            valorComercialReal: valorComercialReal,
            porcentajeValorComercialReal: porcentajeValorComercialReal,
            depreciacionReal: depreciacionReal,
            mesPorAnio: dto.mesesPorAnio || 12,
            aniosFinanciamiento: dto.aniosFinanciamiento || 0,
            tasaFinanciamiento: dto.tasaFinanciamiento || 0,
            aniosSeguro: dto.aniosSeguro || 0,
            tasaSeguro: dto.tasaSeguro || 0,
          },
          ratiosUsdHr: {
            costoMPrevLubricantes: ratios.lubricantes,
            costoMPrevFiltros: ratios.filtros,
            costoMPrevMaterialesFerreteria: ratios.materialesFerreteria,
            costoMCorrMaterialesElectricos: ratios.materialesElectricos,
            costoMCorrMangueras: ratios.mangueras,
            costoMCorrMenores: ratios.menores,
            costoMCorrMayores: totalPptoPics / horasUsoAnual, // Usar el total dividido por horas anuales
            // Componentes reales de la BD (IDs 1-7)
            motor:
              (componentesMap.motor * ratios.mayores * horasUsoAnual) /
              vidaUtilFabricante,
            transmision:
              (componentesMap.transmision * ratios.mayores * horasUsoAnual) /
              vidaUtilFabricante,
            convertidor:
              (componentesMap.convertidor * ratios.mayores * horasUsoAnual) /
              vidaUtilFabricante,
            mandosFinales:
              (componentesMap.mandosFinales * ratios.mayores * horasUsoAnual) /
              vidaUtilFabricante,
            diferenciales:
              (componentesMap.diferenciales * ratios.mayores * horasUsoAnual) /
              vidaUtilFabricante,
            sistemaHidraulico:
              (componentesMap.sistemaHidraulico *
                ratios.mayores *
                horasUsoAnual) /
              vidaUtilFabricante,
            sistemaElectrico:
              (componentesMap.sistemaElectrico *
                ratios.mayores *
                horasUsoAnual) /
              vidaUtilFabricante,
            costoMantenimientoNeumaticos:
              (ratios.neumaticos * horasUsoAnual) / vidaUtilFabricante,
            costoMantenimientoSoldaduraEstructuras: ratios.soldaduraEstructuras,
            costoMantenimientoGets: ratios.gets,
            pptoPics: totalPptoPics,
            incidenciaPicSobreValorNuevo: totalPptoPics / valorSimilarNuevo,
          },
        },
        seccion3: {
          posesion: {
            depreciacion: depreciacionHorariaPosesion,
            financiamiento: financiamientoHorariaPosesion,
            seguroTrec: seguroHorariaPosesion,
            subtotal: subtotalPosesion,
            subtotalFijos: subtotalPosesion, // Mismo valor que subtotal
            gastoDistribuibles: 0,
            utilidad: 0,
            totalCostoFijo: subtotalPosesion, // subtotal + utilidad
          },
        },
        seccion4: {
          mantenimientoPreventivo:
            ratios.lubricantes + ratios.filtros + ratios.materialesFerreteria,
          mantenimientoCorrectivo:
            ratios.materialesElectricos +
            ratios.mangueras +
            ratios.menores +
            ratios.soldaduraEstructuras +
            totalPptoPics / horasUsoAnual,
          estructural: ratios.soldaduraEstructuras,
          neumaticos: ratios.neumaticos,
          manoDeObraTecnico: dto.mano_de_obra_tecnico || 0,
          elementosDesgaste: ratios.gets,
          subtotalVariable: subtotalVariableCalculado,
          utilidad: 0,
          totalCostoVariable: subtotalVariableCalculado,
        },
        totales: {
          total: esc.horasMinimas,
          fijosMasVariables: subtotalPosesion + subtotalVariableCalculado,
        },
      };
    });

    return {
      version: '1.0.0',
      comentario: dto.comentario,
      machine: {
        id: machine.id,
        item: machine.id,
        equipo: machine.modelo?.equipo?.nombre || null,
        marca: machine.modelo?.marca?.nombre || null,
        modelo: machine.modelo?.nombre || null,
        horometroInicial: machine.horometro_inicial,
        estado: machine.estado,
        idEquipo: machine.id_equipo_interno,
      },
      parametros: {
        machineId: dto.machineId,
        posesionId: dto.posesionId,
        mesesPorAnio: dto.mesesPorAnio || 12,
        tasaFinanciamiento: dto.tasaFinanciamiento || 0,
        aniosFinanciamiento: dto.aniosFinanciamiento || 0,
        tasaSeguro: dto.tasaSeguro || 0,
        aniosSeguro: dto.aniosSeguro || 0,
        comentario: dto.comentario,
        usuarioId: dto.usuarioId,
        incluyeGastosDistribuibles: dto.incluyeGastosDistribuibles || false,
        costoMCorrMayores: dto.costoMCorrMayores,
        porcentajeUtilidad: machine.modelo?.porcentaje_utilidad || 0,
        fechaCalculo: new Date().toISOString(),
      },
      ratiosMeta: ratiosRaw.map((r) => ({
        id: r.id,
        tipo: r.tipo_ratio.nombre,
        categoria: r.tipo_ratio.categoria,
        valor: r.valor,
        fecha_efectiva: r.fecha_efectiva,
      })),
      componentesMeta: componentesRaw.map((c) => ({
        id: c.id,
        componente: c.componente.nombre,
        monto_usd: c.monto_usd,
        pcr: c.pcr,
        distribucion: c.distribucion,
        monto_aplicado_al_proyecto: c.monto_aplicado_al_proyecto,
        fecha_efectiva: c.fecha_efectiva,
      })),
      escenarios: escenariosCalculo,
    };
  }

  /**
   * Valida y limpia el usuario_id para asegurar que sea un UUID válido
   */
  private validateAndCleanUsuarioId(usuarioId?: string): string | undefined {
    if (!usuarioId) {
      return undefined;
    }

    // Regex para validar UUID v4
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(usuarioId)) {
      return usuarioId;
    }

    // Si no es un UUID válido, retornamos undefined
    return undefined;
  }

  /**
   * Calcula y guarda el informe de costo horario en la base de datos
   */
  async calculateAndSave(dto: CreateInformeCostoHorarioDto): Promise<any> {
    try {
      // Realizar el cálculo (reutilizamos el método preview)
      const resultado = await this.preview(dto);

      // Validar UUID si se proporciona
      const validUsuarioId = this.validateAndCleanUsuarioId(dto.usuarioId);

      // Obtener los escenarios para guardar separadamente
      const escenarios = await this.getEscenariosFromPosesion(dto.posesionId);

      // Guardar en la base de datos
      const historialEntry = await this.prisma.informeCostoHorario.create({
        data: {
          machine_id: dto.machineId,
          usuario_id: validUsuarioId,
          resultado_completo_json: resultado as any,
          escenarios_horas: { escenarios } as any,
          tasa_financiamiento_usada: dto.tasaFinanciamiento || 0.09,
          anios_financiamiento: dto.aniosFinanciamiento || 3,
          tasa_seguro_usada: dto.tasaSeguro || 0.01,
          anios_seguro: dto.aniosSeguro || 1,
          mes_por_anio: dto.mesesPorAnio || 12,
          // fecha_calculo se maneja automáticamente por Prisma con @default(now())
        },
      });

      return {
        ...historialEntry,
        machine_info: {
          id: resultado.machine.id,
          id_equipo_interno: resultado.machine.idEquipo,
          modelo: resultado.machine.modelo,
        },
      };
    } catch (error: unknown) {
      console.error(
        'Error calculating and saving informe costo horario:',
        error,
      );
      throw error;
    }
  }

  /**
   * Obtener historial de informe de costo horario por machine_id
   */
  async findHistorialByMachine(machineId: number): Promise<any[]> {
    try {
      const historial = await this.prisma.informeCostoHorario.findMany({
        where: { machine_id: machineId },
        orderBy: { fecha_calculo: 'desc' },
      });

      return historial;
    } catch (error: unknown) {
      console.error(`Error finding historial for machine ${machineId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener un registro específico del historial
   */
  async findHistorialById(id: number): Promise<any> {
    try {
      const historial = await this.prisma.informeCostoHorario.findUnique({
        where: { id },
        include: {
          machine: {
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
        throw new NotFoundException(`Historial with ID ${id} not found`);
      }

      return historial;
    } catch (error: unknown) {
      console.error(`Error finding historial ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene un resumen simplificado del costo horario basado en un registro de posesión
   */
  async getResumenCostoHorario(
    posesionId: number,
    machineId: number,
    dto: CreateInformeCostoHorarioDto,
  ): Promise<any> {
    try {
      console.log(
        `[RESUMEN] ========== INICIO RESUMEN COSTO HORARIO ==========`,
      );
      console.log(
        `[RESUMEN] Posesión ID: ${posesionId}, Machine ID: ${machineId}`,
      );

      // Obtener la máquina
      const machine = await this.prisma.machines.findUnique({
        where: { id: machineId },
        include: { modelo: { include: { marca: true, equipo: true } } },
      });
      if (!machine) throw new NotFoundException('Machine not found');

      console.log(
        `[RESUMEN] Máquina encontrada: ${machine.modelo?.marca?.nombre} ${machine.modelo?.nombre}`,
      );
      console.log(`[RESUMEN] Modelo ID: ${machine.modelo_id}`);

      // Obtener escenarios desde posesión
      const escenarios = await this.getEscenariosFromPosesion(posesionId);
      console.log(
        `[RESUMEN] Escenarios obtenidos: ${escenarios.length} escenarios`,
      );
      escenarios.forEach((esc, index) => {
        console.log(
          `[RESUMEN] Escenario ${index + 1}: Hmin=${esc.horasMinimas}, Grado=${esc.gradoOperatividad}, Factor=${esc.factorMercado}`,
        );
      });

      const valorSimilarNuevo = Number(machine.valor_similar_nuevo);
      const vidaUtilFabricante =
        machine.vida_util || machine.modelo?.vida_util_fabricante || 0;

      console.log(
        `[RESUMEN] Valor Similar Nuevo: $${valorSimilarNuevo.toLocaleString()}`,
      );
      console.log(
        `[RESUMEN] Vida Útil Fabricante: ${vidaUtilFabricante} horas`,
      );

      // Ratios históricos vinculados al modelo
      const { map: ratiosModelo } = await this.getRatiosPorModelo(
        machine.modelo_id as number,
      );
      console.log(`[RESUMEN] Ratios obtenidos del modelo:`);
      Object.entries(ratiosModelo).forEach(([key, value]) => {
        console.log(`[RESUMEN]   ${key}: ${value}`);
      });

      // Componentes históricos vinculados al modelo
      const { componentesMap } = await this.getComponentesPorModelo(
        machine.modelo_id as number,
      );
      console.log(`[RESUMEN] Componentes obtenidos del modelo:`);
      Object.entries(componentesMap).forEach(([key, value]) => {
        console.log(`[RESUMEN]   ${key}: $${value.toLocaleString()}`);
      });

      const resumenEscenarios = escenarios.map((esc) => {
        const horasUsoAnual = esc.horasMinimas * 12;

        console.log(`[RESUMEN] ===== INICIANDO CÁLCULO PARA ESCENARIO =====`);
        console.log(`[RESUMEN] Horas mínimas: ${esc.horasMinimas}`);
        console.log(`[RESUMEN] Horas uso anual: ${horasUsoAnual}`);
        console.log(`[RESUMEN] Grado operatividad: ${esc.gradoOperatividad}`);
        console.log(`[RESUMEN] Factor mercado: ${esc.factorMercado}`);

        // Cálculos básicos para el resumen
        const valorResidual10 = valorSimilarNuevo * 0.1;
        const valorComercialTeorico = valorResidual10 * esc.gradoOperatividad;
        const valorComercialReal = valorComercialTeorico * esc.factorMercado;
        const depreciacionReal = valorSimilarNuevo - valorComercialReal;

        console.log(
          `[RESUMEN] Valor Similar Nuevo: $${valorSimilarNuevo.toLocaleString()}`,
        );
        console.log(
          `[RESUMEN] Valor Residual 10%: $${valorResidual10.toLocaleString()}`,
        );
        console.log(
          `[RESUMEN] Valor Comercial Teórico: $${valorComercialTeorico.toLocaleString()}`,
        );
        console.log(
          `[RESUMEN] Valor Comercial Real: $${valorComercialReal.toLocaleString()}`,
        );
        console.log(
          `[RESUMEN] Depreciación Real: $${depreciacionReal.toLocaleString()}`,
        );
        console.log(
          `[RESUMEN] Vida Útil Fabricante: ${vidaUtilFabricante} horas`,
        );

        // D: Depreciación horaria
        const D = depreciacionReal / vidaUtilFabricante;
        console.log(
          `[RESUMEN] D (Depreciación horaria): $${D.toFixed(4)} = ${depreciacionReal} / ${vidaUtilFabricante}`,
        );

        // F: Financiamiento horario (usando datos por defecto si no se proporcionan)
        const tasaFinanciamiento = 0.09; // 9% por defecto
        const aniosFinanciamiento = 3; // 3 años por defecto
        console.log(
          `[RESUMEN] Tasa Financiamiento: ${tasaFinanciamiento}, Años: ${aniosFinanciamiento}`,
        );

        const amortizacionData = this.calcularAmortizacion(
          valorSimilarNuevo,
          tasaFinanciamiento,
          12,
          aniosFinanciamiento,
        );
        const F =
          amortizacionData.totalInteres /
          (12 * aniosFinanciamiento * esc.horasMinimas);
        console.log(
          `[RESUMEN] F (Financiamiento horario): $${F.toFixed(4)} = ${amortizacionData.totalInteres} / (12 * ${aniosFinanciamiento} * ${esc.horasMinimas})`,
        );

        // S: Seguro horario
        const tasaSeguro = 0.01; // 1% por defecto
        const S = (valorSimilarNuevo * tasaSeguro) / (12 * esc.horasMinimas);
        console.log(
          `[RESUMEN] S (Seguro horario): $${S.toFixed(4)} = (${valorSimilarNuevo} * ${tasaSeguro}) / (12 * ${esc.horasMinimas})`,
        );

        // Ratios para mantenimiento - necesitamos calcular los componentes primero
        const ratiosMayores =
          ratiosModelo.mayores || dto.costoMCorrMayores || 0;
        console.log(`[RESUMEN] ----- RATIOS DEL MODELO -----`);
        console.log(`[RESUMEN] Lubricantes: ${ratiosModelo.lubricantes}`);
        console.log(`[RESUMEN] Filtros: ${ratiosModelo.filtros}`);
        console.log(
          `[RESUMEN] Materiales Ferretería: ${ratiosModelo.materialesFerreteria}`,
        );
        console.log(
          `[RESUMEN] Materiales Eléctricos: ${ratiosModelo.materialesElectricos}`,
        );
        console.log(`[RESUMEN] Mangueras: ${ratiosModelo.mangueras}`);
        console.log(`[RESUMEN] Menores: ${ratiosModelo.menores}`);
        console.log(`[RESUMEN] Mayores (desde BD): ${ratiosModelo.mayores}`);
        console.log(`[RESUMEN] Mayores (usado para cálculo): ${ratiosMayores}`);
        console.log(`[RESUMEN] Neumáticos: ${ratiosModelo.neumaticos}`);
        console.log(`[RESUMEN] Estructural: ${ratiosModelo.estructural}`);
        console.log(`[RESUMEN] Desgaste: ${ratiosModelo.desgaste}`);

        console.log(`[RESUMEN] ----- COMPONENTES MAP (IDs 1-7) -----`);
        console.log(`[RESUMEN] Motor: ${componentesMap.motor}`);
        console.log(`[RESUMEN] Transmisión: ${componentesMap.transmision}`);
        console.log(`[RESUMEN] Convertidor: ${componentesMap.convertidor}`);
        console.log(
          `[RESUMEN] Mandos Finales: ${componentesMap.mandosFinales}`,
        );
        console.log(`[RESUMEN] Diferenciales: ${componentesMap.diferenciales}`);
        console.log(
          `[RESUMEN] Sistema Hidráulico: ${componentesMap.sistemaHidraulico}`,
        );
        console.log(
          `[RESUMEN] Sistema Eléctrico: ${componentesMap.sistemaElectrico}`,
        );

        // Cálculo de componentes PICs usando ratios mayores - con componentes reales (IDs 1-7)
        const componentePics = {
          motor:
            (componentesMap.motor * ratiosMayores * horasUsoAnual) /
            vidaUtilFabricante,
          transmision:
            (componentesMap.transmision * ratiosMayores * horasUsoAnual) /
            vidaUtilFabricante,
          convertidor:
            (componentesMap.convertidor * ratiosMayores * horasUsoAnual) /
            vidaUtilFabricante,
          mandosFinales:
            (componentesMap.mandosFinales * ratiosMayores * horasUsoAnual) /
            vidaUtilFabricante,
          diferenciales:
            (componentesMap.diferenciales * ratiosMayores * horasUsoAnual) /
            vidaUtilFabricante,
          sistemaHidraulico:
            (componentesMap.sistemaHidraulico * ratiosMayores * horasUsoAnual) /
            vidaUtilFabricante,
          sistemaElectrico:
            (componentesMap.sistemaElectrico * ratiosMayores * horasUsoAnual) /
            vidaUtilFabricante,
          neumaticos:
            (ratiosModelo.neumaticos * horasUsoAnual) / vidaUtilFabricante,
        };

        console.log(`[RESUMEN] ----- COMPONENTES PICs CALCULADOS -----`);
        console.log(
          `[RESUMEN] Motor PIC: ${componentePics.motor.toFixed(4)} = (${componentesMap.motor} * ${ratiosMayores} * ${horasUsoAnual}) / ${vidaUtilFabricante}`,
        );
        console.log(
          `[RESUMEN] Transmisión PIC: ${componentePics.transmision.toFixed(4)} = (${componentesMap.transmision} * ${ratiosMayores} * ${horasUsoAnual}) / ${vidaUtilFabricante}`,
        );
        console.log(
          `[RESUMEN] Convertidor PIC: ${componentePics.convertidor.toFixed(4)} = (${componentesMap.convertidor} * ${ratiosMayores} * ${horasUsoAnual}) / ${vidaUtilFabricante}`,
        );
        console.log(
          `[RESUMEN] Mandos Finales PIC: ${componentePics.mandosFinales.toFixed(4)} = (${componentesMap.mandosFinales} * ${ratiosMayores} * ${horasUsoAnual}) / ${vidaUtilFabricante}`,
        );
        console.log(
          `[RESUMEN] Diferenciales PIC: ${componentePics.diferenciales.toFixed(4)} = (${componentesMap.diferenciales} * ${ratiosMayores} * ${horasUsoAnual}) / ${vidaUtilFabricante}`,
        );
        console.log(
          `[RESUMEN] Sistema Hidráulico PIC: ${componentePics.sistemaHidraulico.toFixed(4)} = (${componentesMap.sistemaHidraulico} * ${ratiosMayores} * ${horasUsoAnual}) / ${vidaUtilFabricante}`,
        );
        console.log(
          `[RESUMEN] Sistema Eléctrico PIC: ${componentePics.sistemaElectrico.toFixed(4)} = (${componentesMap.sistemaElectrico} * ${ratiosMayores} * ${horasUsoAnual}) / ${vidaUtilFabricante}`,
        );
        console.log(
          `[RESUMEN] Neumáticos PIC: ${componentePics.neumaticos.toFixed(4)} = (${ratiosModelo.neumaticos} * ${horasUsoAnual}) / ${vidaUtilFabricante}`,
        );

        // Cálculo total de PPTO PICs - solo la suma de los 7 componentes PICs (IDs 1-7)
        const totalPptoPics =
          componentePics.motor +
          componentePics.transmision +
          componentePics.convertidor +
          componentePics.mandosFinales +
          componentePics.diferenciales +
          componentePics.sistemaHidraulico +
          componentePics.sistemaElectrico;

        console.log(
          `[RESUMEN] ----- CÁLCULO TOTAL PPTO PICs (Solo 7 Componentes) -----`,
        );
        console.log(`[RESUMEN] Motor PIC: ${componentePics.motor.toFixed(4)}`);
        console.log(
          `[RESUMEN] Transmisión PIC: ${componentePics.transmision.toFixed(4)}`,
        );
        console.log(
          `[RESUMEN] Convertidor PIC: ${componentePics.convertidor.toFixed(4)}`,
        );
        console.log(
          `[RESUMEN] Mandos Finales PIC: ${componentePics.mandosFinales.toFixed(4)}`,
        );
        console.log(
          `[RESUMEN] Diferenciales PIC: ${componentePics.diferenciales.toFixed(4)}`,
        );
        console.log(
          `[RESUMEN] Sistema Hidráulico PIC: ${componentePics.sistemaHidraulico.toFixed(4)}`,
        );
        console.log(
          `[RESUMEN] Sistema Eléctrico PIC: ${componentePics.sistemaElectrico.toFixed(4)}`,
        );
        console.log(`[RESUMEN] TOTAL PPTO PICs: ${totalPptoPics.toFixed(4)}`);

        // Ratios para mantenimiento - ahora usando el totalPptoPics calculado
        const ratios = {
          lubricantes: ratiosModelo.lubricantes,
          filtros: ratiosModelo.filtros,
          materialesFerreteria: ratiosModelo.materialesFerreteria,
          materialesElectricos: ratiosModelo.materialesElectricos,
          mangueras: ratiosModelo.mangueras,
          menores: ratiosModelo.menores,
          mayores: totalPptoPics / horasUsoAnual, // Usar el total dividido por horas anuales como en preview
          neumaticos: ratiosModelo.neumaticos,
          soldaduraEstructuras: ratiosModelo.estructural,
          gets: ratiosModelo.desgaste,
        };

        console.log(`[RESUMEN] ----- RATIOS FINALES PARA CÁLCULO -----`);
        console.log(
          `[RESUMEN] Mayores (calculado): ${ratios.mayores.toFixed(4)} = ${totalPptoPics.toFixed(4)} / ${horasUsoAnual}`,
        );
        console.log(`[RESUMEN] Lubricantes: ${ratios.lubricantes}`);
        console.log(`[RESUMEN] Filtros: ${ratios.filtros}`);
        console.log(
          `[RESUMEN] Materiales Ferretería: ${ratios.materialesFerreteria}`,
        );
        console.log(
          `[RESUMEN] Materiales Eléctricos: ${ratios.materialesElectricos}`,
        );
        console.log(`[RESUMEN] Mangueras: ${ratios.mangueras}`);
        console.log(`[RESUMEN] Menores: ${ratios.menores}`);
        console.log(`[RESUMEN] Neumáticos: ${ratios.neumaticos}`);
        console.log(
          `[RESUMEN] Soldadura Estructuras: ${ratios.soldaduraEstructuras}`,
        );
        console.log(`[RESUMEN] Gets: ${ratios.gets}`);

        // Mp: Mantenimiento Preventivo
        const Mp =
          ratios.lubricantes + ratios.filtros + ratios.materialesFerreteria;
        console.log(
          `[RESUMEN] Mp (Mantenimiento Preventivo): ${Mp.toFixed(4)} = ${ratios.lubricantes} + ${ratios.filtros} + ${ratios.materialesFerreteria}`,
        );

        // Mc: Mantenimiento Correctivo
        const Mc =
          ratios.materialesElectricos +
          ratios.mangueras +
          ratios.menores +
          ratios.mayores;
        console.log(
          `[RESUMEN] Mc (Mantenimiento Correctivo): ${Mc.toFixed(4)} = ${ratios.materialesElectricos} + ${ratios.mangueras} + ${ratios.menores} + ${ratios.mayores.toFixed(4)}`,
        );

        // Est: Estructural
        const Est = ratios.soldaduraEstructuras;
        console.log(`[RESUMEN] Est (Estructural): ${Est.toFixed(4)}`);

        // Neu: Neumáticos
        const Neu = ratios.neumaticos;
        console.log(`[RESUMEN] Neu (Neumáticos): ${Neu.toFixed(4)}`);

        // Gets: Elementos de desgaste
        const Gets = ratios.gets;
        console.log(
          `[RESUMEN] Gets (Elementos de desgaste): ${Gets.toFixed(4)}`,
        );

        // Posesión: D + F + S
        const Posesion = D + F + S;
        console.log(
          `[RESUMEN] Posesión: ${Posesion.toFixed(4)} = ${D.toFixed(4)} + ${F.toFixed(4)} + ${S.toFixed(4)}`,
        );

        // Rym: Mp + Mc + Est + Neu + Gets
        const Rym = Mp + Mc + Est + Neu + Gets;
        console.log(
          `[RESUMEN] RyM: ${Rym.toFixed(4)} = ${Mp.toFixed(4)} + ${Mc.toFixed(4)} + ${Est.toFixed(4)} + ${Neu.toFixed(4)} + ${Gets.toFixed(4)}`,
        );

        // MOTec: Rym * 0.25
        const MOTec = Rym * 0.25;
        console.log(
          `[RESUMEN] MOTec: ${MOTec.toFixed(4)} = ${Rym.toFixed(4)} * 0.25`,
        );

        // Costo_Hr: Posesion + Rym + MOTec
        const Costo_Hr = Posesion + Rym + MOTec;
        console.log(
          `[RESUMEN] Costo_Hr: ${Costo_Hr.toFixed(4)} = ${Posesion.toFixed(4)} + ${Rym.toFixed(4)} + ${MOTec.toFixed(4)}`,
        );

        // Tarifa: Costo_Hr * (1 + porcentaje_utilidad)
        const porcentajeUtilidad = machine.modelo?.porcentaje_utilidad || 0;
        const Tarifa = Costo_Hr * (1 + porcentajeUtilidad);
        console.log(
          `[RESUMEN] Tarifa: ${Tarifa.toFixed(4)} = ${Costo_Hr.toFixed(4)} * (1 + ${porcentajeUtilidad})`,
        );
        console.log(`[RESUMEN] ===== FIN CÁLCULO ESCENARIO =====\n`);

        return {
          'V.Adq ($)': valorSimilarNuevo,
          Hmin: esc.horasMinimas,
          D: Number(D.toFixed(2)),
          F: Number(F.toFixed(2)),
          S: Number(S.toFixed(2)),
          Mp: Number(Mp.toFixed(2)),
          Mc: Number(Mc.toFixed(2)),
          Est: Number(Est.toFixed(2)),
          Neu: Number(Neu.toFixed(2)),
          Gets: Number(Gets.toFixed(2)),
          Posesión: Number(Posesion.toFixed(2)),
          RyM: Number(Rym.toFixed(2)),
          MOTec: Number(MOTec.toFixed(2)),
          Costo_Hr: Number(Costo_Hr.toFixed(2)),
          U: `${(porcentajeUtilidad * 100).toFixed(0)}%`,
          Tarifa: Number(Tarifa.toFixed(2)),
        };
      });

      return {
        machine: {
          id: machine.id,
          item: machine.id,
          equipo: machine.modelo?.equipo?.nombre || null,
          marca: machine.modelo?.marca?.nombre || null,
          modelo: machine.modelo?.nombre || null,
          estado: machine.estado,
          idEquipo: machine.id_equipo_interno,
        },
        parametros: {
          posesionId,
          tasaFinanciamiento: 0.09,
          aniosFinanciamiento: 3,
          tasaSeguro: 0.01,
          porcentajeUtilidad: machine.modelo?.porcentaje_utilidad || 0,
          fechaCalculo: new Date().toISOString(),
        },
        resumen: resumenEscenarios,
      };
    } catch (error: unknown) {
      console.error('Error generating resumen costo horario:', error);
      throw error;
    }
  }

  /**
   * Genera resumen basado en un historial existente
   */
  async getResumenFromHistorial(historialId: number) {
    const historial = await this.findHistorialById(historialId);

    if (
      !historial.resultado_completo_json ||
      !historial.resultado_completo_json.escenarios
    ) {
      throw new NotFoundException(
        `No se encontraron escenarios en el historial con ID ${historialId}`,
      );
    }

    // Extraer datos del historial
    const machine = historial.machine;
    const informeData = historial.resultado_completo_json as any;

    // Construir el resumen desde los datos del historial
    const resumen = informeData.escenarios.map((escenario: any) => {
      // Extraer valores calculados de las secciones del informe
      const seccion3 = escenario.seccion3?.posesion || {};
      const seccion4 = escenario.seccion4 || {};
      const totales = escenario.totales || {};

      // Calcular valores individuales
      const posesion = Number((seccion3.subtotal || 0).toFixed(2));
      const rym = Number((seccion4.subtotalVariable || 0).toFixed(2));
      const motec = Number(
        ((seccion4.subtotalVariable || 0) * 0.25).toFixed(2),
      ); // 25% de RyM

      // Costo_Hr debe ser la suma de Posesión + RyM + MOTec
      const costoHr = Number((posesion + rym + motec).toFixed(2));

      return {
        'V.Adq ($)': escenario.seccion2?.descripcion?.valorSimilarNuevo || 0,
        Hmin: escenario.horasMinimas || 0,
        D: Number((seccion3.depreciacion || 0).toFixed(2)),
        F: Number((seccion3.financiamiento || 0).toFixed(2)),
        S: Number((seccion3.seguroTrec || 0).toFixed(2)),
        Mp: Number((seccion4.mantenimientoPreventivo || 0).toFixed(2)),
        Mc: Number((seccion4.mantenimientoCorrectivo || 0).toFixed(2)),
        Est: Number((seccion4.estructural || 0).toFixed(2)),
        Neu: Number((seccion4.neumaticos || 0).toFixed(2)),
        Gets: Number((seccion4.elementosDesgaste || 0).toFixed(2)),
        Posesión: posesion,
        RyM: rym,
        MOTec: motec,
        Costo_Hr: costoHr,
        U: `${((informeData.parametros?.porcentajeUtilidad || 0) * 100).toFixed(0)}%`,
        Tarifa: Number(
          (
            costoHr *
            (1 + (informeData.parametros?.porcentajeUtilidad || 0))
          ).toFixed(2),
        ),
      };
    });

    return {
      machine: {
        id: machine.id,
        item: machine.id,
        equipo: machine.modelo?.equipo?.nombre || null,
        marca: machine.modelo?.marca?.nombre || null,
        modelo: machine.modelo?.nombre || null,
        estado: machine.estado,
        idEquipo: machine.id_equipo_interno,
      },
      parametros: {
        machineId: informeData.parametros?.machineId || historial.machine_id,
        posesionId: informeData.parametros?.posesionId || historial.machine_id, // usando machine_id como referencia
        mesesPorAnio: informeData.parametros?.mesesPorAnio || 12,
        tasaFinanciamiento: informeData.parametros?.tasaFinanciamiento || 0,
        aniosFinanciamiento: informeData.parametros?.aniosFinanciamiento || 0,
        tasaSeguro: informeData.parametros?.tasaSeguro || 0,
        aniosSeguro: informeData.parametros?.aniosSeguro || 0,
        comentario: informeData.parametros?.comentario,
        usuarioId: informeData.parametros?.usuarioId,
        incluyeGastosDistribuibles:
          informeData.parametros?.incluyeGastosDistribuibles || false,
        costoMCorrMayores: informeData.parametros?.costoMCorrMayores,
        porcentajeUtilidad: informeData.parametros?.porcentajeUtilidad || 0,
        fechaCalculo: historial.fecha_calculo.toISOString(),
      },
      resumen: resumen,
    };
  }

  /**
   * Método de compatibilidad para el endpoint anterior
   * Busca el historial más reciente de la máquina y devuelve el resumen
   */
  async getResumenCostoHorarioCompatibilidad(
    posesionId: number,
    machineId: number,
  ) {
    // Buscar el historial más reciente para esta máquina
    const historiales = await this.findHistorialByMachine(machineId);

    if (!historiales || historiales.length === 0) {
      throw new NotFoundException(
        `No se encontró historial para la máquina con ID ${machineId}`,
      );
    }

    // Tomar el más reciente (el primero, ya que está ordenado por fecha descendente)
    const historialMasReciente = historiales[0];

    // Usar el método existente para generar el resumen
    return this.getResumenFromHistorial(historialMasReciente.id);
  }

  /**
   * Obtiene todas las máquinas con sus últimos reportes de costo horario
   * Solo incluye máquinas que tienen al menos un reporte de costo horario
   */
  async getAllMachinesWithLatestReports(): Promise<any[]> {
    try {
      // Obtener todas las máquinas que tienen reportes de costo horario
      const machinesWithReports = await this.prisma.machines.findMany({
        where: {
          informe_costo_horario: {
            some: {}, // Máquinas que tienen al menos un informe
          },
        },
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
            },
          },
          informe_costo_horario: {
            orderBy: { fecha_calculo: 'desc' },
            take: 1, // Solo el más reciente
            select: {
              id: true,
              fecha_calculo: true,
              tasa_financiamiento_usada: true,
              anios_financiamiento: true,
              tasa_seguro_usada: true,
              anios_seguro: true,
              mes_por_anio: true,
              usuario_id: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      // Formatear la respuesta
      const result = machinesWithReports.map((machine) => {
        const latestReport = machine.informe_costo_horario[0];

        return {
          machine: {
            id: machine.id,
            item: machine.id,
            equipo: machine.modelo?.equipo?.nombre || null,
            marca: machine.modelo?.marca?.nombre || null,
            modelo: machine.modelo?.nombre || null,
            horometroInicial: machine.horometro_inicial,
            estado: machine.estado,
            idEquipo: machine.id_equipo_interno,
            valorSimilarNuevo: machine.valor_similar_nuevo,
            politicaDepreciacion: machine.politica_depreciacion,
            vidaUtil: machine.vida_util,
          },
          latestReport: latestReport
            ? {
                id: latestReport.id,
                fechaCalculo: latestReport.fecha_calculo,
                tasaFinanciamiento: latestReport.tasa_financiamiento_usada,
                aniosFinanciamiento: latestReport.anios_financiamiento,
                tasaSeguro: latestReport.tasa_seguro_usada,
                aniosSeguro: latestReport.anios_seguro,
                mesPorAnio: latestReport.mes_por_anio,
                usuarioId: latestReport.usuario_id,
              }
            : null,
          hasReports: !!latestReport,
          totalReports: machine.informe_costo_horario.length,
        };
      });

      return result;
    } catch (error: unknown) {
      console.error('Error getting all machines with latest reports:', error);
      throw error;
    }
  }

  /**
   * Obtiene el resumen simplificado para múltiples máquinas
   * Basado en sus últimos reportes de costo horario
   */
  async getAllMachinesResumenReports(): Promise<any[]> {
    try {
      const machinesWithReports = await this.getAllMachinesWithLatestReports();

      const resumenes = await Promise.all(
        machinesWithReports.map(async (machineData) => {
          if (!machineData.latestReport) {
            return {
              machine: machineData.machine,
              latestReport: null,
              resumen: null,
              hasReports: false,
            };
          }

          try {
            // Generar el resumen usando el historial más reciente
            const resumenData = await this.getResumenFromHistorial(
              machineData.latestReport.id,
            );

            return {
              machine: machineData.machine,
              latestReport: machineData.latestReport,
              resumen: resumenData.resumen, // Solo el array de resumen, no toda la respuesta
              parametros: resumenData.parametros,
              hasReports: true,
              totalReports: machineData.totalReports,
            };
          } catch (error) {
            console.error(
              `Error generating resumen for machine ${machineData.machine.id}:`,
              error,
            );
            return {
              machine: machineData.machine,
              latestReport: machineData.latestReport,
              resumen: null,
              error: 'Error generating resumen',
              hasReports: true,
              totalReports: machineData.totalReports,
            };
          }
        }),
      );

      return resumenes;
    } catch (error: unknown) {
      console.error('Error getting all machines resumen reports:', error);
      throw error;
    }
  }
}
