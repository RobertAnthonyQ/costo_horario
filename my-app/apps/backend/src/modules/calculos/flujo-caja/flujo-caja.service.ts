import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { InformeCostoHorarioService } from '../informe_costo_horario/informe-costo-horario.service';
import { CreateAnalisisFlujoDto } from './dto/create-analisis-flujo.dto';
import {
  FlujoCajaResponse,
  DatosPrecargadosInforme,
} from './interfaces/flujo-caja-response.interface';

@Injectable()
export class FlujoCajaService {
  constructor(
    private prisma: PrismaService,
    private informeCostoHorarioService: InformeCostoHorarioService,
  ) {}

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
      (escenario: any) => {
        const horasMinimas = Number(escenario.horasMinimas || 0);
        const gradoOperatividad = Number(escenario.gradoOperatividad || 0);
        const factorMercado = Number(escenario.factorMercado || 0);
        const horasUsoAnual = Number(
          escenario.horasUsoAnual || horasMinimas * mesesAlAnio,
        );

        console.log(
          `[FLUJO-CAJA] Escenario: Hmin=${horasMinimas}, Grado=${gradoOperatividad}, Factor=${factorMercado}, HorasAnual=${horasUsoAnual}`,
        );

        return {
          horasMinimas,
          gradoOperatividad,
          factorMercado,
          horasUsoAnual,
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
    const valorResidual = datosPrecargados.valorAdquisicion * response.parametros.porcentajeResidual;
    const valorDepreciacion = datosPrecargados.valorAdquisicion - valorResidual;
    console.log(
      `[FLUJO-CAJA] Años de operación estimados (vida_util/horasMes*12): ${aniosOperacionEstimados}`,
    );

    const resultadoConCalculo = {
      ...response,
      estado: 'calculado',
      resultadoFlujo: {
        // Aquí puedes agregar la lógica de cálculo específica
        // Por ahora devolvemos la estructura básica
        calculoCompleto: true,
        fechaCalculo: new Date().toISOString(),
        valorResidual,
        valorDepreciacion,
        vidaUtilHoras,
        margenInterno: response.parametros.margenInterno,
        gastosGeneralesdeMantenimiento:response.parametros.gastosGeneralesMantenimiento,
        aniosOperacionEstimados,
        FlujoDecajaOperacion: {
          horasOperativasMes,
          mesesAlAnio: datosPrecargados.mesesAlAnio,
          tarifainternaporhora: datosPrecargados.totalPosesionMantenimiento, // Este valor se calcularía en base a otros datos
          preventivo: datosPrecargados.mantenimiento.preventivo,
          correctivo: datosPrecargados.mantenimiento.correctivo,
          neumaticos: datosPrecargados.mantenimiento.neumaticos,
          elementosDesgaste: datosPrecargados.mantenimiento.elementosDesgaste,
          soldadura: datosPrecargados.mantenimiento.soldadura,
          manoDeObraSupervision: datosPrecargados.mantenimiento.manoDeObraSupervision,
        },
      },
    };

    return resultadoConCalculo;
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

      return {
        ...flujoHistorial,
        machine_info: {
          id: data.machine.id,
          marca: data.machine.marca,
          modelo: data.machine.modelo,
        },
      };
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

      return historial;
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

      return historial;
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

      return analisis;
    } catch (error: unknown) {
      console.error('Error obteniendo todos los análisis:', error);
      throw error;
    }
  }

  /**
   * Obtiene solo versiones (nombres y fechas) para selección rápida
   */
  async findVersiones(): Promise<any[]> {
    try {
      const versiones = await this.prisma.flujoHistorial.findMany({
        where: {
          deleted_at: null,
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
      return versiones.map((version) => {
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

          console.log(
            `[FLUJO-CAJA] Escenario ${index + 1}: Hmin=${horasMinimas}, Grado=${gradoOperatividad}, Factor=${factorMercado}, HorasAnual=${horasUsoAnual}`,
          );

          return {
            escenarioId: index + 1,
            horasMinimas,
            gradoOperatividad,
            factorMercado,
            horasUsoAnual,
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

      return response;
    } catch (error: unknown) {
      console.error('Error extrayendo escenarios:', error);
      throw error;
    }
  }
}
