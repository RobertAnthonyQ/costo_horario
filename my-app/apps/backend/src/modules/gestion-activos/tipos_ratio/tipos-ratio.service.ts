import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateTiposRatioDto } from './dto/create-tipos-ratio.dto';
import { UpdateTiposRatioDto } from './dto/update-tipos-ratio.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class TiposRatioService {
  private readonly logger = new Logger(TiposRatioService.name);

  constructor(private prisma: PrismaService) {}

  async create(createTiposRatioDto: CreateTiposRatioDto) {
    try {
      this.logger.log(`Creando tipo de ratio: ${createTiposRatioDto.nombre}`);

      const tipoRatio = await this.prisma.tiposRatio.create({
        data: createTiposRatioDto,
      });

      this.logger.log(`Tipo de ratio creado con ID: ${tipoRatio.id}`);
      return tipoRatio;
    } catch (error) {
      this.logger.error(`Error al crear tipo de ratio: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Ya existe un tipo de ratio con ese nombre',
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Obteniendo todos los tipos de ratio');

    return this.prisma.tiposRatio.findMany({
      include: {
        _count: {
          select: {
            ratios_historico: true,
          },
        },
      },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: number) {
    this.logger.log(`Buscando tipo de ratio con ID: ${id}`);

    const tipoRatio = await this.prisma.tiposRatio.findUnique({
      where: { id },
      include: {
        ratios_historico: {
          include: {
            modelo: {
              include: {
                marca: true,
                equipo: true,
              },
            },
          },
          orderBy: {
            fecha_efectiva: 'desc',
          },
        },
      },
    });

    if (!tipoRatio) {
      throw new NotFoundException(`Tipo de ratio con ID ${id} no encontrado`);
    }

    return tipoRatio;
  }

  async update(id: number, updateTiposRatioDto: UpdateTiposRatioDto) {
    try {
      this.logger.log(`Actualizando tipo de ratio con ID: ${id}`);

      // Verificar que el tipo de ratio existe
      await this.findOne(id);

      const tipoRatio = await this.prisma.tiposRatio.update({
        where: { id },
        data: updateTiposRatioDto,
        include: {
          _count: {
            select: {
              ratios_historico: true,
            },
          },
        },
      });

      this.logger.log(`Tipo de ratio actualizado: ${tipoRatio.nombre}`);
      return tipoRatio;
    } catch (error) {
      this.logger.error(`Error al actualizar tipo de ratio: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Ya existe un tipo de ratio con ese nombre',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      this.logger.log(`Eliminando tipo de ratio con ID: ${id}`);

      // Verificar que el tipo de ratio existe
      const tipoRatioExistente = await this.findOne(id);

      // Verificar si tiene ratios históricos asociados
      const ratiosCount = await this.prisma.ratiosHistorico.count({
        where: { tipo_ratio_id: id },
      });

      if (ratiosCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar el tipo de ratio porque tiene ${ratiosCount} registros históricos asociados`,
        );
      }

      const tipoRatio = await this.prisma.tiposRatio.delete({
        where: { id },
      });

      this.logger.log(`Tipo de ratio eliminado: ${tipoRatio.nombre}`);
      return tipoRatio;
    } catch (error) {
      this.logger.error(`Error al eliminar tipo de ratio: ${error.message}`);
      throw error;
    }
  }

  async getStatistics() {
    this.logger.log('Obteniendo estadísticas de tipos de ratio');

    const totalTiposRatio = await this.prisma.tiposRatio.count();

    const tiposRatioConHistorico = await this.prisma.tiposRatio.count({
      where: {
        ratios_historico: {
          some: {},
        },
      },
    });

    // Estadísticas por categoría
    const estadisticasPorCategoria = await this.prisma.tiposRatio.groupBy({
      by: ['categoria'],
      _count: true,
      orderBy: {
        _count: {
          categoria: 'desc',
        },
      },
    });

    // Top tipos de ratio más utilizados
    const topTiposRatio = await this.prisma.tiposRatio.findMany({
      include: {
        _count: {
          select: {
            ratios_historico: true,
          },
        },
      },
      orderBy: {
        ratios_historico: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      total_tipos_ratio: totalTiposRatio,
      tipos_ratio_con_historico: tiposRatioConHistorico,
      tipos_ratio_sin_historico: totalTiposRatio - tiposRatioConHistorico,
      estadisticas_por_categoria: estadisticasPorCategoria.map((item) => ({
        categoria: item.categoria || 'Sin categoría',
        cantidad: item._count,
      })),
      top_tipos_ratio: topTiposRatio.map((tipo) => ({
        id: tipo.id,
        nombre: tipo.nombre,
        categoria: tipo.categoria,
        cantidad_registros: tipo._count.ratios_historico,
      })),
    };
  }

  async findByCategoria(categoria: string) {
    this.logger.log(`Buscando tipos de ratio por categoría: ${categoria}`);

    return this.prisma.tiposRatio.findMany({
      where: { categoria: categoria as any },
      include: {
        _count: {
          select: {
            ratios_historico: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }
}
