import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateComponenteDto } from './dto/create-componente.dto';
import { UpdateComponenteDto } from './dto/update-componente.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  serializeBigInt,
  serializeBigIntArray,
} from '../../../utils/bigint-serializer';

@Injectable()
export class ComponentesService {
  private readonly logger = new Logger(ComponentesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createComponenteDto: CreateComponenteDto) {
    try {
      this.logger.log(`Creando componente: ${createComponenteDto.nombre}`);

      const componente = await this.prisma.componentes.create({
        data: createComponenteDto,
      });

      this.logger.log(`Componente creado con ID: ${componente.id}`);
      return serializeBigInt(componente);
    } catch (error) {
      this.logger.error(`Error al crear componente: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Ya existe un componente con ese nombre');
        }
      }
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Obteniendo todos los componentes');

    const componentes = await this.prisma.componentes.findMany({
      include: {
        modelo_componentes_historico: {
          include: {
            modelo: {
              include: {
                marca: true,
                equipo: true,
                flota: true,
              },
            },
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return serializeBigIntArray(componentes);
  }

  async findOne(id: number) {
    this.logger.log(`Buscando componente con ID: ${id}`);

    const componente = await this.prisma.componentes.findUnique({
      where: { id },
      include: {
        modelo_componentes_historico: {
          include: {
            modelo: {
              include: {
                marca: true,
                equipo: true,
                flota: true,
              },
            },
          },
        },
      },
    });

    if (!componente) {
      throw new NotFoundException(`Componente con ID ${id} no encontrado`);
    }

    return serializeBigInt(componente);
  }

  async update(id: number, updateComponenteDto: UpdateComponenteDto) {
    try {
      this.logger.log(`Actualizando componente con ID: ${id}`);

      // Verificar que el componente existe
      await this.findOne(id);

      const componente = await this.prisma.componentes.update({
        where: { id },
        data: updateComponenteDto,
        include: {
          modelo_componentes_historico: true,
        },
      });

      this.logger.log(`Componente actualizado: ${componente.nombre}`);
      return serializeBigInt(componente);
    } catch (error) {
      this.logger.error(`Error al actualizar componente: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Ya existe un componente con ese nombre');
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      this.logger.log(`Eliminando componente con ID: ${id}`);

      // Verificar que el componente existe
      await this.findOne(id);

      // Verificar si tiene registros históricos asociados
      const historicosCount =
        await this.prisma.modeloComponentesHistorico.count({
          where: { componente_id: id },
        });

      if (historicosCount > 0) {
        throw new Error(
          `No se puede eliminar el componente porque tiene ${historicosCount} registros históricos asociados`,
        );
      }

      const componente = await this.prisma.componentes.delete({
        where: { id },
      });

      this.logger.log(`Componente eliminado: ${componente.nombre}`);
      return serializeBigInt(componente);
    } catch (error) {
      this.logger.error(`Error al eliminar componente: ${error.message}`);
      throw error;
    }
  }

  async getStatistics() {
    this.logger.log('Obteniendo estadísticas de componentes');

    const totalComponentes = await this.prisma.componentes.count();
    const componentesConHistoricos = await this.prisma.componentes.count({
      where: {
        modelo_componentes_historico: {
          some: {},
        },
      },
    });

    const topComponentes = await this.prisma.componentes.findMany({
      include: {
        _count: {
          select: {
            modelo_componentes_historico: true,
          },
        },
      },
      orderBy: {
        modelo_componentes_historico: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      total_componentes: totalComponentes,
      componentes_con_historicos: componentesConHistoricos,
      componentes_sin_historicos: totalComponentes - componentesConHistoricos,
      top_componentes: topComponentes.map((componente) => ({
        id: componente.id,
        nombre: componente.nombre,
        cantidad_historicos: componente._count.modelo_componentes_historico,
      })),
    };
  }

  async findByModelo(modeloId: number) {
    this.logger.log(`Buscando componentes del modelo ID: ${modeloId}`);

    const componentes = await this.prisma.componentes.findMany({
      where: {
        modelo_componentes_historico: {
          some: {
            modelo_id: modeloId,
          },
        },
      },
      include: {
        modelo_componentes_historico: {
          where: {
            modelo_id: modeloId,
          },
          orderBy: {
            fecha_efectiva: 'desc',
          },
          take: 1,
        },
      },
    });

    return serializeBigIntArray(componentes);
  }
}
