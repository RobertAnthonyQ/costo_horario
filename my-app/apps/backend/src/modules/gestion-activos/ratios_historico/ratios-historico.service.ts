import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateRatiosHistoricoDto } from './dto/create-ratios-historico.dto';
import { UpdateRatiosHistoricoDto } from './dto/update-ratios-historico.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class RatiosHistoricoService {
  private readonly logger = new Logger(RatiosHistoricoService.name);

  constructor(private prisma: PrismaService) {}

  async create(createRatiosHistoricoDto: CreateRatiosHistoricoDto) {
    try {
      this.logger.log(
        `Creando ratio histórico para modelo ID: ${createRatiosHistoricoDto.modelo_id}, tipo ratio ID: ${createRatiosHistoricoDto.tipo_ratio_id}`,
      );

      // Verificar que el modelo existe
      const modelo = await this.prisma.modelos.findUnique({
        where: { id: createRatiosHistoricoDto.modelo_id },
        include: { marca: true },
      });
      if (!modelo) {
        throw new BadRequestException(
          `Modelo con ID ${createRatiosHistoricoDto.modelo_id} no encontrado`,
        );
      }

      // Verificar que el tipo de ratio existe
      const tipoRatio = await this.prisma.tiposRatio.findUnique({
        where: { id: createRatiosHistoricoDto.tipo_ratio_id },
      });
      if (!tipoRatio) {
        throw new BadRequestException(
          `Tipo de ratio con ID ${createRatiosHistoricoDto.tipo_ratio_id} no encontrado`,
        );
      }

      // Convertir fecha string a DateTime para Prisma
      const dataToCreate = {
        ...createRatiosHistoricoDto,
        fecha_efectiva: new Date(createRatiosHistoricoDto.fecha_efectiva),
      };

      const ratioHistorico = await this.prisma.ratiosHistorico.create({
        data: dataToCreate,
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
              flota: true,
            },
          },
          tipo_ratio: true,
        },
      });

      this.logger.log(`Ratio histórico creado con ID: ${ratioHistorico.id}`);
      return ratioHistorico;
    } catch (error) {
      this.logger.error(`Error al crear ratio histórico: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Ya existe un registro con esa combinación de modelo, tipo de ratio y fecha',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Error de referencia: verificar IDs de modelo y tipo de ratio',
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Obteniendo todos los ratios históricos');

    return this.prisma.ratiosHistorico.findMany({
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
            flota: true,
          },
        },
        tipo_ratio: true,
      },
      orderBy: [
        { fecha_efectiva: 'desc' },
        { modelo: { nombre: 'asc' } },
        { tipo_ratio: { nombre: 'asc' } },
      ],
    });
  }

  async findOne(id: number) {
    this.logger.log(`Buscando ratio histórico con ID: ${id}`);

    const ratioHistorico = await this.prisma.ratiosHistorico.findUnique({
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
        tipo_ratio: true,
      },
    });

    if (!ratioHistorico) {
      throw new NotFoundException(`Ratio histórico con ID ${id} no encontrado`);
    }

    return ratioHistorico;
  }

  async update(id: number, updateRatiosHistoricoDto: UpdateRatiosHistoricoDto) {
    try {
      this.logger.log(`Actualizando ratio histórico con ID: ${id}`);

      // Verificar que el ratio histórico existe
      await this.findOne(id);

      // Verificar relaciones si se proporcionan
      if (updateRatiosHistoricoDto.modelo_id) {
        const modelo = await this.prisma.modelos.findUnique({
          where: { id: updateRatiosHistoricoDto.modelo_id },
        });
        if (!modelo) {
          throw new BadRequestException(
            `Modelo con ID ${updateRatiosHistoricoDto.modelo_id} no encontrado`,
          );
        }
      }

      if (updateRatiosHistoricoDto.tipo_ratio_id) {
        const tipoRatio = await this.prisma.tiposRatio.findUnique({
          where: { id: updateRatiosHistoricoDto.tipo_ratio_id },
        });
        if (!tipoRatio) {
          throw new BadRequestException(
            `Tipo de ratio con ID ${updateRatiosHistoricoDto.tipo_ratio_id} no encontrado`,
          );
        }
      }

      // Preparar datos para actualización
      const dataToUpdate = { ...updateRatiosHistoricoDto };
      if (dataToUpdate.fecha_efectiva) {
        dataToUpdate.fecha_efectiva = new Date(
          dataToUpdate.fecha_efectiva,
        ) as any;
      }

      const ratioHistorico = await this.prisma.ratiosHistorico.update({
        where: { id },
        data: dataToUpdate,
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
              flota: true,
            },
          },
          tipo_ratio: true,
        },
      });

      this.logger.log(`Ratio histórico actualizado: ${ratioHistorico.id}`);
      return ratioHistorico;
    } catch (error) {
      this.logger.error(
        `Error al actualizar ratio histórico: ${error.message}`,
      );

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Ya existe un registro con esa combinación de modelo, tipo de ratio y fecha',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Error de referencia: verificar IDs de modelo y tipo de ratio',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      this.logger.log(`Eliminando ratio histórico con ID: ${id}`);

      // Verificar que el ratio histórico existe
      await this.findOne(id);

      const ratioHistorico = await this.prisma.ratiosHistorico.delete({
        where: { id },
      });

      this.logger.log(`Ratio histórico eliminado: ${ratioHistorico.id}`);
      return ratioHistorico;
    } catch (error) {
      this.logger.error(`Error al eliminar ratio histórico: ${error.message}`);
      throw error;
    }
  }

  async findByModelo(modeloId: number) {
    this.logger.log(`Buscando ratios históricos del modelo ID: ${modeloId}`);

    return this.prisma.ratiosHistorico.findMany({
      where: { modelo_id: modeloId },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
          },
        },
        tipo_ratio: true,
      },
      orderBy: [{ fecha_efectiva: 'desc' }, { tipo_ratio: { nombre: 'asc' } }],
    });
  }

  async findByTipoRatio(tipoRatioId: number) {
    this.logger.log(
      `Buscando ratios históricos del tipo de ratio ID: ${tipoRatioId}`,
    );

    return this.prisma.ratiosHistorico.findMany({
      where: { tipo_ratio_id: tipoRatioId },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
            flota: true,
          },
        },
        tipo_ratio: true,
      },
      orderBy: [{ fecha_efectiva: 'desc' }, { modelo: { nombre: 'asc' } }],
    });
  }

  async findByFechaRange(fechaDesde: string, fechaHasta: string) {
    this.logger.log(
      `Buscando ratios históricos entre ${fechaDesde} y ${fechaHasta}`,
    );

    const fechaDesdeDate = new Date(fechaDesde);
    const fechaHastaDate = new Date(fechaHasta);

    return this.prisma.ratiosHistorico.findMany({
      where: {
        fecha_efectiva: {
          gte: fechaDesdeDate,
          lte: fechaHastaDate,
        },
      },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
          },
        },
        tipo_ratio: true,
      },
      orderBy: [
        { fecha_efectiva: 'desc' },
        { modelo: { nombre: 'asc' } },
        { tipo_ratio: { nombre: 'asc' } },
      ],
    });
  }

  async getLatestByModelo(modeloId: number) {
    this.logger.log(
      `Obteniendo ratios más recientes del modelo ID: ${modeloId}`,
    );

    // Obtener el ratio más reciente de cada tipo para un modelo específico
    const ratiosRecientes = await this.prisma.ratiosHistorico.findMany({
      where: { modelo_id: modeloId },
      include: {
        modelo: {
          include: {
            marca: true,
            equipo: true,
          },
        },
        tipo_ratio: true,
      },
      orderBy: {
        fecha_efectiva: 'desc',
      },
    });

    // Agrupar por tipo_ratio_id y tomar solo el más reciente de cada tipo
    const ratiosMap = new Map();
    for (const ratio of ratiosRecientes) {
      if (!ratiosMap.has(ratio.tipo_ratio_id)) {
        ratiosMap.set(ratio.tipo_ratio_id, ratio);
      }
    }

    return Array.from(ratiosMap.values());
  }

  async getStatistics() {
    this.logger.log('Obteniendo estadísticas de ratios históricos');

    const totalRatios = await this.prisma.ratiosHistorico.count();

    // Estadísticas por tipo de ratio
    const ratiosPorTipo = await this.prisma.ratiosHistorico.groupBy({
      by: ['tipo_ratio_id'],
      _count: true,
      _avg: { valor: true },
      orderBy: {
        _count: {
          tipo_ratio_id: 'desc',
        },
      },
      take: 5,
    });

    const tiposRatioConStats = await this.prisma.tiposRatio.findMany({
      where: {
        id: { in: ratiosPorTipo.map((r) => r.tipo_ratio_id) },
      },
      select: { id: true, nombre: true, categoria: true },
    });

    const topTiposRatio = ratiosPorTipo.map((item) => {
      const tipoRatio = tiposRatioConStats.find(
        (t) => t.id === item.tipo_ratio_id,
      );
      return {
        tipo_ratio_id: item.tipo_ratio_id,
        nombre: tipoRatio?.nombre || 'Desconocido',
        categoria: tipoRatio?.categoria,
        cantidad_registros: item._count,
        valor_promedio: item._avg.valor || 0,
      };
    });

    // Estadísticas por modelo
    const ratiosPorModelo = await this.prisma.ratiosHistorico.groupBy({
      by: ['modelo_id'],
      _count: true,
      orderBy: {
        _count: {
          modelo_id: 'desc',
        },
      },
      take: 5,
    });

    const modelosConStats = await this.prisma.modelos.findMany({
      where: {
        id: { in: ratiosPorModelo.map((r) => r.modelo_id) },
      },
      include: {
        marca: { select: { nombre: true } },
      },
    });

    const topModelos = ratiosPorModelo.map((item) => {
      const modelo = modelosConStats.find((m) => m.id === item.modelo_id);
      return {
        modelo_id: item.modelo_id,
        nombre: modelo?.nombre || 'Desconocido',
        marca: modelo?.marca?.nombre || 'Desconocida',
        cantidad_registros: item._count,
      };
    });

    return {
      total_ratios: totalRatios,
      top_tipos_ratio: topTiposRatio,
      top_modelos: topModelos,
    };
  }
}
