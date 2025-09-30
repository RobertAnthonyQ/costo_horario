import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateModeloComponentesHistoricoDto } from './dto/create-modelo-componentes-historico.dto';
import { UpdateModeloComponentesHistoricoDto } from './dto/update-modelo-componentes-historico.dto';
import { Decimal } from '@prisma/client/runtime/library';
import {
  serializeBigInt,
  serializeBigIntArray,
} from '../../../utils/bigint-serializer';

@Injectable()
export class ModeloComponentesHistoricoService {
  private readonly logger = new Logger(ModeloComponentesHistoricoService.name);

  constructor(private prisma: PrismaService) {}

  // Función auxiliar para agregar campos calculados
  private addCalculatedFields(registro: any) {
    const montoUsd = registro.monto_usd ? Number(registro.monto_usd) : 0;
    const pcrValue = registro.pcr ? Number(registro.pcr) : 0;

    // Calcular distribución: vida_util / pcr
    let distribucion = 0;
    let vidaUtilParaCalculo: number | null = null;

    // Obtener vida_util del modelo o máquina
    if (registro.modelo?.vida_util_fabricante) {
      vidaUtilParaCalculo = registro.modelo.vida_util_fabricante;
    }

    if (vidaUtilParaCalculo && pcrValue && pcrValue > 0) {
      distribucion = parseFloat((vidaUtilParaCalculo / pcrValue).toFixed(8));
    }

    return {
      ...registro,
      distribucion,
      monto_aplicado_al_proyecto: montoUsd * distribucion,
    };
  }

  // Función auxiliar para agregar campos calculados a múltiples registros
  private addCalculatedFieldsToArray(registros: any[]) {
    return registros.map((registro) => this.addCalculatedFields(registro));
  }

  async create(
    createModeloComponentesHistoricoDto: CreateModeloComponentesHistoricoDto,
  ) {
    try {
      this.logger.log('Iniciando creación de registro histórico de componente');
      this.logger.log(
        'DTO recibido:',
        JSON.stringify(createModeloComponentesHistoricoDto, null, 2),
      );

      // Verificar que el modelo existe y obtener vida_util_fabricante
      this.logger.log(
        `Verificando modelo ID: ${createModeloComponentesHistoricoDto.modelo_id}`,
      );
      const modelo = await this.prisma.modelos.findUnique({
        where: { id: createModeloComponentesHistoricoDto.modelo_id },
      });
      if (!modelo) {
        this.logger.error(
          `Modelo con ID ${createModeloComponentesHistoricoDto.modelo_id} no encontrado`,
        );
        throw new BadRequestException(
          `Modelo con ID ${createModeloComponentesHistoricoDto.modelo_id} no encontrado`,
        );
      }
      this.logger.log('Modelo encontrado:', JSON.stringify(modelo, null, 2));

      // Verificar que el componente existe
      this.logger.log(
        `Verificando componente ID: ${createModeloComponentesHistoricoDto.componente_id}`,
      );
      const componenteExists = await this.prisma.componentes.findUnique({
        where: { id: createModeloComponentesHistoricoDto.componente_id },
      });
      if (!componenteExists) {
        this.logger.error(
          `Componente con ID ${createModeloComponentesHistoricoDto.componente_id} no encontrado`,
        );
        throw new BadRequestException(
          `Componente con ID ${createModeloComponentesHistoricoDto.componente_id} no encontrado`,
        );
      }
      this.logger.log(
        'Componente encontrado:',
        JSON.stringify(componenteExists, null, 2),
      );

      // Calcular distribución automáticamente usando vida_util
      let distribucionCalculada = 0;
      let vidaUtilParaCalculo: number | null = null;

      // Prioridad 1: Si se proporciona machine_id, usar su vida_util
      if (createModeloComponentesHistoricoDto.machine_id) {
        this.logger.log(
          `Buscando máquina ID: ${createModeloComponentesHistoricoDto.machine_id}`,
        );
        const machine = await this.prisma.machines.findUnique({
          where: { id: createModeloComponentesHistoricoDto.machine_id },
          select: { vida_util: true, modelo_id: true },
        });

        if (!machine) {
          this.logger.error(
            `Máquina con ID ${createModeloComponentesHistoricoDto.machine_id} no encontrada`,
          );
          throw new BadRequestException(
            `Máquina con ID ${createModeloComponentesHistoricoDto.machine_id} no encontrada`,
          );
        }

        // Verificar que la máquina pertenece al modelo especificado
        if (
          machine.modelo_id !==
          BigInt(createModeloComponentesHistoricoDto.modelo_id)
        ) {
          this.logger.error(
            `La máquina ID ${createModeloComponentesHistoricoDto.machine_id} pertenece al modelo ID ${machine.modelo_id}, no al modelo ID ${createModeloComponentesHistoricoDto.modelo_id}`,
          );
          throw new BadRequestException(
            `La máquina ID ${createModeloComponentesHistoricoDto.machine_id} no pertenece al modelo ID ${createModeloComponentesHistoricoDto.modelo_id}`,
          );
        }

        vidaUtilParaCalculo = machine.vida_util;
        this.logger.log(`Usando vida_util de máquina: ${vidaUtilParaCalculo}`);
      }

      // Prioridad 2: Si no hay machine_id o machine.vida_util, usar vida_util_fabricante del modelo
      if (!vidaUtilParaCalculo && modelo.vida_util_fabricante) {
        vidaUtilParaCalculo = modelo.vida_util_fabricante;
        this.logger.log(
          `Usando vida_util_fabricante del modelo: ${vidaUtilParaCalculo}`,
        );
      }

      // Calcular distribución: vida_util / pcr
      if (vidaUtilParaCalculo && vidaUtilParaCalculo > 0) {
        const pcrValue = createModeloComponentesHistoricoDto.pcr;

        if (!pcrValue || pcrValue <= 0) {
          this.logger.error(
            'PCR es requerido y debe ser mayor a 0 para calcular la distribución',
          );
          throw new BadRequestException(
            'PCR es requerido y debe ser mayor a 0 para calcular la distribución',
          );
        }

        distribucionCalculada = vidaUtilParaCalculo / pcrValue;
        // Redondear a 8 decimales para evitar problemas de precisión en PostgreSQL
        distribucionCalculada = parseFloat(distribucionCalculada.toFixed(8));
        this.logger.log(
          `Distribución calculada: vida_util(${vidaUtilParaCalculo}) / pcr(${pcrValue}) = ${distribucionCalculada}`,
        );
      }

      // Si no se pudo calcular distribución, usar valor por defecto o error
      if (distribucionCalculada === 0) {
        this.logger.error(
          'No se pudo calcular la distribución - vida_util no disponible o es 0',
        );
        throw new BadRequestException(
          'No se pudo calcular la distribución. Verifique que el modelo tenga vida_util_fabricante o proporcione un machine_id válido con vida_util, y que el PCR sea válido',
        );
      }

      this.logger.log('Creando registro en base de datos...');

      // Limpiar y validar los datos antes de crear
      const cleanData = {
        modelo_id: Number(createModeloComponentesHistoricoDto.modelo_id),
        componente_id: Number(
          createModeloComponentesHistoricoDto.componente_id,
        ),
        monto_usd: createModeloComponentesHistoricoDto.monto_usd
          ? parseFloat(createModeloComponentesHistoricoDto.monto_usd.toString())
          : null,
        pcr: createModeloComponentesHistoricoDto.pcr
          ? parseFloat(createModeloComponentesHistoricoDto.pcr.toString())
          : null,
        fecha_efectiva: new Date(
          createModeloComponentesHistoricoDto.fecha_efectiva,
        ),
      };

      this.logger.log(
        'Datos limpiados para crear:',
        JSON.stringify(cleanData, null, 2),
      );

      // Validar que los números no sean NaN o Infinity
      if (
        cleanData.monto_usd !== null &&
        (!isFinite(cleanData.monto_usd) || isNaN(cleanData.monto_usd))
      ) {
        throw new BadRequestException(
          'monto_usd contiene un valor numérico inválido',
        );
      }
      if (
        cleanData.pcr !== null &&
        (!isFinite(cleanData.pcr) || isNaN(cleanData.pcr))
      ) {
        throw new BadRequestException(
          'pcr contiene un valor numérico inválido',
        );
      }

      const registro = await this.prisma.modeloComponentesHistorico.create({
        data: cleanData,
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
              flota: true,
            },
          },
          componente: true,
        },
      });

      this.logger.log('Registro creado exitosamente con ID:', registro.id);
      const resultado = this.addCalculatedFields(registro);
      this.logger.log('Resultado final:', JSON.stringify(resultado, null, 2));
      return serializeBigInt(resultado);
    } catch (error) {
      this.logger.error('Error en create:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      // Log del error original para debugging
      this.logger.error('Error original:', error);

      throw new BadRequestException(
        'Error al crear el registro histórico de componente',
      );
    }
  }

  async findAll() {
    const registros = await this.prisma.modeloComponentesHistorico.findMany({
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
            flota: true,
          },
        },
        componente: true,
      },
      orderBy: {
        fecha_efectiva: 'desc',
      },
    });

    return serializeBigIntArray(this.addCalculatedFieldsToArray(registros));
  }

  async findOne(id: number) {
    const registro = await this.prisma.modeloComponentesHistorico.findUnique({
      where: { id },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
            flota: true,
            machines: {
              select: {
                id: true,
                estado: true,
                id_equipo_interno: true,
              },
            },
          },
        },
        componente: true,
      },
    });

    if (!registro) {
      throw new NotFoundException(
        `Registro histórico de componente con ID ${id} no encontrado`,
      );
    }

    return serializeBigInt(this.addCalculatedFields(registro));
  }

  async update(
    id: number,
    updateModeloComponentesHistoricoDto: UpdateModeloComponentesHistoricoDto,
  ) {
    try {
      // Verificar que el registro existe
      const registroExists =
        await this.prisma.modeloComponentesHistorico.findUnique({
          where: { id },
        });
      if (!registroExists) {
        throw new NotFoundException(
          `Registro histórico de componente con ID ${id} no encontrado`,
        );
      }

      // Verificar modelo si se está actualizando
      if (updateModeloComponentesHistoricoDto.modelo_id) {
        const modeloExists = await this.prisma.modelos.findUnique({
          where: { id: updateModeloComponentesHistoricoDto.modelo_id },
        });
        if (!modeloExists) {
          throw new BadRequestException(
            `Modelo con ID ${updateModeloComponentesHistoricoDto.modelo_id} no encontrado`,
          );
        }
      }

      // Verificar componente si se está actualizando
      if (updateModeloComponentesHistoricoDto.componente_id) {
        const componenteExists = await this.prisma.componentes.findUnique({
          where: { id: updateModeloComponentesHistoricoDto.componente_id },
        });
        if (!componenteExists) {
          throw new BadRequestException(
            `Componente con ID ${updateModeloComponentesHistoricoDto.componente_id} no encontrado`,
          );
        }
      }

      const updateData: any = { ...updateModeloComponentesHistoricoDto };
      if (updateModeloComponentesHistoricoDto.fecha_efectiva) {
        updateData.fecha_efectiva = new Date(
          updateModeloComponentesHistoricoDto.fecha_efectiva,
        );
      }

      const registro = await this.prisma.modeloComponentesHistorico.update({
        where: { id },
        data: updateData,
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
              flota: true,
            },
          },
          componente: true,
        },
      });

      return serializeBigInt(this.addCalculatedFields(registro));
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Error al actualizar el registro histórico de componente',
      );
    }
  }

  async remove(id: number) {
    const registroExists =
      await this.prisma.modeloComponentesHistorico.findUnique({
        where: { id },
      });

    if (!registroExists) {
      throw new NotFoundException(
        `Registro histórico de componente con ID ${id} no encontrado`,
      );
    }

    const registro = await this.prisma.modeloComponentesHistorico.delete({
      where: { id },
    });

    return serializeBigInt(registro);
  }

  async findByModelo(modeloId: number) {
    const registros = await this.prisma.modeloComponentesHistorico.findMany({
      where: { modelo_id: modeloId },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
            flota: true,
          },
        },
        componente: true,
      },
      orderBy: {
        fecha_efectiva: 'desc',
      },
    });

    return serializeBigIntArray(this.addCalculatedFieldsToArray(registros));
  }

  async findByComponente(componenteId: number) {
    const registros = await this.prisma.modeloComponentesHistorico.findMany({
      where: { componente_id: componenteId },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
            flota: true,
          },
        },
        componente: true,
      },
      orderBy: {
        fecha_efectiva: 'desc',
      },
    });

    return serializeBigIntArray(this.addCalculatedFieldsToArray(registros));
  }

  async findByFechaRange(fechaDesde: string, fechaHasta: string) {
    const registros = await this.prisma.modeloComponentesHistorico.findMany({
      where: {
        fecha_efectiva: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta),
        },
      },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
            flota: true,
          },
        },
        componente: true,
      },
      orderBy: {
        fecha_efectiva: 'desc',
      },
    });

    return serializeBigIntArray(this.addCalculatedFieldsToArray(registros));
  }

  async getLatestByModelo(modeloId: number) {
    // Obtener el registro más reciente de cada componente para un modelo específico
    const registros = await this.prisma.modeloComponentesHistorico.findMany({
      where: { modelo_id: modeloId },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
          },
        },
        componente: true,
      },
      orderBy: {
        fecha_efectiva: 'desc',
      },
    });

    // Mantener solo el más reciente por componente_id
    const latestByComponenteId = new Map<number, (typeof registros)[number]>();
    for (const registro of registros) {
      if (!latestByComponenteId.has(Number(registro.componente_id))) {
        latestByComponenteId.set(Number(registro.componente_id), registro);
      }
    }

    const latestRegistros = Array.from(latestByComponenteId.values());
    return serializeBigIntArray(
      this.addCalculatedFieldsToArray(latestRegistros),
    );
  }

  async getStatistics() {
    const totalRegistros = await this.prisma.modeloComponentesHistorico.count();

    // Top componentes por cantidad de registros históricos
    const topComponentes = await this.prisma.modeloComponentesHistorico.groupBy(
      {
        by: ['componente_id'],
        _count: {
          id: true,
        },
        _avg: {
          monto_usd: true,
          pcr: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      },
    );

    // Obtener detalles de los componentes
    const componentesIds = topComponentes.map((t) => t.componente_id);
    const componentes = await this.prisma.componentes.findMany({
      where: {
        id: { in: componentesIds },
      },
    });

    const topComponentesWithDetails = topComponentes.map((t) => {
      const componente = componentes.find((c) => c.id === t.componente_id);
      return {
        componente_id: t.componente_id,
        nombre: componente?.nombre || 'Desconocido',
        cantidad_registros: t._count?.id || 0,
        monto_usd_promedio: t._avg?.monto_usd || null,
        pcr_promedio: t._avg?.pcr || null,
        // Nota: distribucion_promedio se calculará en el frontend ya que es un campo calculado
      };
    });

    // Top modelos por cantidad de registros históricos
    const topModelos = await this.prisma.modeloComponentesHistorico.groupBy({
      by: ['modelo_id'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Obtener detalles de los modelos
    const modelosIds = topModelos.map((t) => t.modelo_id);
    const modelos = await this.prisma.modelos.findMany({
      where: {
        id: { in: modelosIds },
      },
      include: {
        marca: true,
      },
    });

    const topModelosWithDetails = topModelos.map((t) => {
      const modelo = modelos.find((m) => m.id === t.modelo_id);
      return {
        modelo_id: t.modelo_id,
        nombre: modelo?.nombre || 'Desconocido',
        marca: modelo?.marca?.nombre || 'Desconocida',
        cantidad_registros: t._count?.id || 0,
      };
    });

    return {
      total_registros: totalRegistros,
      top_componentes: topComponentesWithDetails,
      top_modelos: topModelosWithDetails,
    };
  }

  // Método auxiliar para obtener máquinas de un modelo con su vida_util
  async getMachinesByModelo(modeloId: number) {
    return this.prisma.machines.findMany({
      where: { modelo_id: modeloId },
      select: {
        id: true,
        id_equipo_interno: true,
        estado: true,
        vida_util: true,
        horometro_inicial: true,
      },
      orderBy: {
        id_equipo_interno: 'asc',
      },
    });
  }
}
