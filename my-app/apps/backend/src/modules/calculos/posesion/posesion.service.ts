import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateCalculoPosesionDto } from './dto/create-calculo-posesion.dto';
// Tipos e interfaces locales definidas aquí

// Tipo para los datos de entrada de cada escenario
interface EscenarioInput {
  horasMinimas: number;
  gradoDeOperatividad: number;
  factorDeMercado: number;
}

// Tipo para los resultados de un escenario de horas específico
interface EscenarioCalculos {
  horasMinimas: number;
  aniosVidaIdeal: number;
  vidaUtilFabricante: number;
  depreciacionTeorica: number;
  gradoDeOperatividad: number;
  valorComercialTeorico: number;
  factorDeMercado: number;
  valorComercialReal: number;
  porcentajeValorComercialReal: number;
  depreciacionReal: number;
  depreciacionRealAnual: number;
  depreciacionRealHoraria: number;
}

// Tipo para los resultados completos con múltiples escenarios
interface ResultadosCompletos {
  escenarios: EscenarioCalculos[];
  machine_id: number;
  fecha_calculo: string;
  inputs: CreateCalculoPosesionDto;
}

@Injectable()
export class PosesionService {
  private readonly logger = new Logger(PosesionService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    // Si no es un UUID válido, logueamos la advertencia y retornamos undefined
    this.logger.warn(
      `Invalid UUID provided for usuario_id: ${usuarioId}. Setting to null.`,
    );
    return undefined;
  }

  /**
   * Realiza los cálculos para un escenario específico
   */
  private performCalculationForEscenario(
    machine: any, // Cambiamos a any para manejar las relaciones incluidas
    escenarioInput: EscenarioInput,
  ): EscenarioCalculos {
    const { horasMinimas, gradoDeOperatividad, factorDeMercado } =
      escenarioInput;
    const vidaUtilFabricante = machine.vida_util;

    if (
      !vidaUtilFabricante ||
      !machine.valor_similar_nuevo ||
      horasMinimas <= 0
    ) {
      throw new BadRequestException(
        `Datos de la máquina incompletos o inválidos para el cálculo con ${horasMinimas} horas.`,
      );
    }

    // Validar grado de operatividad
    if (gradoDeOperatividad < 0 || gradoDeOperatividad > 1) {
      throw new BadRequestException(
        `gradoDeOperatividad debe estar entre 0 y 1 para ${horasMinimas} horas`,
      );
    }

    // --- CÁLCULOS SECUENCIALES ---
    // Años de vida ideal = vida útil del fabricante / (horas mínimas * 12)
    const aniosVidaIdeal = vidaUtilFabricante / (horasMinimas * 12);

    // Valor residual = 0.1 * valor similar nuevo
    const valorResidual = 0.1 * machine.valor_similar_nuevo;

    //this.logger.debug(`Valor Residual calculado: ${valorResidual}`);

    // depreciación Teórica = (Valor Similar Nuevo - Valor Residual)
    // La fórmula se simplifica ya que está multiplicando y dividiendo por lo mismo
    const depreciacionTeorica = machine.valor_similar_nuevo - valorResidual;

    //this.logger.debug(`Depreciación Teórica calculada: ${depreciacionTeorica}`);

    // valor comercial teórico= (valor similar nuevo - depreciación teórica) * (grado de operatividad)
    const valorComercialTeorico =
      (machine.valor_similar_nuevo - depreciacionTeorica) * gradoDeOperatividad;
    this.logger.debug(`----------------------------------`);
    this.logger.debug(`Valor Similar Nuevo: ${machine.valor_similar_nuevo}`);
    this.logger.debug(`Depreciación Teórica: ${depreciacionTeorica}`);
    this.logger.debug(`Grado de Operatividad: ${gradoDeOperatividad}`);
    // Valor Comercial Real = Valor Comercial Teórico * Factor de Mercado
    const valorComercialReal = valorComercialTeorico * factorDeMercado;

    // % Valor Comercial Real
    const porcentajeValorComercialReal =
      (valorComercialReal / machine.valor_similar_nuevo) * 100;

    // TODO: Completar con la fórmula correcta para Depreciación Real
    const depreciacionReal = machine.valor_similar_nuevo - valorComercialReal; // Placeholder - REEMPLAZAR CON FÓRMULA REAL

    // Depreciación Real Anual = Depreciación Real / Años de vida ideal
    const depreciacionRealAnual = depreciacionReal / aniosVidaIdeal;

    // Depreciación Real Horaria = Depreciación Real Anual / (horas mínimas * 12)
    const depreciacionRealHoraria = depreciacionRealAnual / (horasMinimas * 12);

    return {
      horasMinimas,
      aniosVidaIdeal,
      vidaUtilFabricante,
      depreciacionTeorica,
      gradoDeOperatividad,
      valorComercialTeorico,
      factorDeMercado,
      valorComercialReal,
      porcentajeValorComercialReal,
      depreciacionReal,
      depreciacionRealAnual,
      depreciacionRealHoraria,
    };
  }

  /**
   * Realiza los cálculos para todos los escenarios de horas mínimas
   */
  private performCalculation(
    machine: any, // Cambiamos a any para manejar las relaciones incluidas
    dto: CreateCalculoPosesionDto,
  ): ResultadosCompletos {
    const escenarios: EscenarioCalculos[] = [];

    // Calcular para cada escenario
    for (const escenarioInput of dto.horas_json.escenarios) {
      const escenario = this.performCalculationForEscenario(
        machine,
        escenarioInput,
      );
      escenarios.push(escenario);
    }

    return {
      escenarios,
      machine_id: dto.machine_id,
      fecha_calculo: new Date().toISOString(),
      inputs: dto,
    };
  }

  /**
   * Calcula y guarda el historial de posesión en la base de datos
   */
  async calculateAndSavePosesion(dto: CreateCalculoPosesionDto): Promise<any> {
    try {
      this.logger.log(`Starting calculation for machine: ${dto.machine_id}`);
      this.logger.log(
        `Number of scenarios: ${dto.horas_json.escenarios.length}`,
      );

      const machine = await this.prisma.machines.findUnique({
        where: { id: dto.machine_id },
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
          `Machine with ID ${dto.machine_id} not found`,
        );
      }

      this.logger.log(
        `Machine found: ${machine.id_equipo_interno || machine.id}`,
      );
      this.logger.log(`Valor Similar Nuevo: ${machine.valor_similar_nuevo}`);
      this.logger.log(`Vida Útil: ${machine.vida_util}`);

      const resultados_json = this.performCalculation(machine, dto);

      this.logger.log(`Calculation completed, attempting to save...`);

      // Validar UUID si se proporciona
      const validUsuarioId = this.validateAndCleanUsuarioId(dto.usuario_id);

      const historialEntry = await this.prisma.posesionHistorial.create({
        data: {
          machine_id: dto.machine_id,
          horas_json: dto.horas_json as any, // Cast necesario para Prisma Json type
          resultados_json: resultados_json as any, // Cast necesario para Prisma Json type
          comentario: dto.comentario,
          usuario_id: validUsuarioId,
          // fecha_calculo se maneja automáticamente por Prisma con @default(now())
        },
      });

      this.logger.log(
        `Posesion calculation saved successfully with ID: ${historialEntry.id} for machine: ${dto.machine_id}`,
      );

      return {
        ...historialEntry,
        machine_info: {
          id: machine.id,
          id_equipo_interno: machine.id_equipo_interno,
          modelo: machine.modelo,
        },
      };
    } catch (error: unknown) {
      this.logger.error('Error calculating and saving posesion:', error);
      // Log más detallado del error para debugging
      if (error instanceof Error) {
        this.logger.error(`Error name: ${error.name}`);
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Solo calcula sin guardar (preview)
   */
  async calculatePosesionPreview(dto: CreateCalculoPosesionDto): Promise<any> {
    try {
      const machine = await this.prisma.machines.findUnique({
        where: { id: dto.machine_id },
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
          `Machine with ID ${dto.machine_id} not found`,
        );
      }

      const resultados = this.performCalculation(machine, dto);

      return {
        machine_info: {
          id: machine.id,
          id_equipo_interno: machine.id_equipo_interno,
          modelo: machine.modelo,
        },
        resultados,
      };
    } catch (error: unknown) {
      this.logger.error('Error calculating posesion preview:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen del historial de posesión por machine_id (solo fechas y datos básicos)
   */
  async findHistorialSummaryByMachine(machineId: number): Promise<any[]> {
    try {
      const historial = await this.prisma.posesionHistorial.findMany({
        where: { machine_id: machineId },
        select: {
          id: true,
          machine_id: true,
          fecha_calculo: true,
          comentario: true,
          usuario_id: true,
          horas_json: true, // Solo para contar escenarios
        },
        orderBy: { fecha_calculo: 'desc' },
      });

      // Procesar para agregar el número de escenarios sin enviar todo el JSON
      return historial.map((item) => ({
        id: item.id,
        machine_id: item.machine_id,
        fecha_calculo: item.fecha_calculo,
        comentario: item.comentario,
        usuario_id: item.usuario_id,
        numero_escenarios: (item.horas_json as any)?.escenarios?.length || 0,
      }));
    } catch (error: unknown) {
      this.logger.error(
        `Error finding historial summary for machine ${machineId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Obtener historial de posesión por machine_id
   */
  async findHistorialByMachine(machineId: number): Promise<any[]> {
    try {
      const historial = await this.prisma.posesionHistorial.findMany({
        where: { machine_id: machineId },
        orderBy: { fecha_calculo: 'desc' },
      });

      return historial;
    } catch (error: unknown) {
      this.logger.error(
        `Error finding historial for machine ${machineId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Obtener un registro específico del historial
   */
  async findHistorialById(id: number): Promise<any> {
    try {
      const historial = await this.prisma.posesionHistorial.findUnique({
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
      this.logger.error(`Error finding historial ${id}:`, error);
      throw error;
    }
  }
}
