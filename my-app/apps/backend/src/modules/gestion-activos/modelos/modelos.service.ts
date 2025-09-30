import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  serializeBigInt,
  serializeBigIntArray,
} from '../../../utils/bigint-serializer';

@Injectable()
export class ModelosService {
  private readonly logger = new Logger(ModelosService.name);

  constructor(private prisma: PrismaService) {}

  async create(createModeloDto: CreateModeloDto) {
    try {
      this.logger.log(`Creando modelo: ${createModeloDto.nombre}`);

      // Verificar que la marca existe
      const marca = await this.prisma.marcas.findUnique({
        where: { id: createModeloDto.marca_id },
      });
      if (!marca) {
        throw new BadRequestException(
          `Marca con ID ${createModeloDto.marca_id} no encontrada`,
        );
      }

      // Verificar que el equipo existe (si se proporciona)
      if (createModeloDto.equipo_id) {
        const equipo = await this.prisma.equipo.findUnique({
          where: { id: createModeloDto.equipo_id },
        });
        if (!equipo) {
          throw new BadRequestException(
            `Equipo con ID ${createModeloDto.equipo_id} no encontrado`,
          );
        }
      }

      // Verificar que la flota existe (si se proporciona)
      if (createModeloDto.flota_id) {
        const flota = await this.prisma.flota.findUnique({
          where: { id: createModeloDto.flota_id },
        });
        if (!flota) {
          throw new BadRequestException(
            `Flota con ID ${createModeloDto.flota_id} no encontrada`,
          );
        }
      }

      // **SIN CONVERSIÓN - EL FRONTEND YA ENVÍA DECIMALES**
      const modeloData = {
        ...createModeloDto,
        porcentaje_utilidad: createModeloDto.porcentaje_utilidad || 0,
      };

      const modelo = await this.prisma.modelos.create({
        data: modeloData,
        include: {
          marca: true,
          equipo: true,
          flota: true,
        },
      });

      this.logger.log(`Modelo creado con ID: ${modelo.id}`);

      return serializeBigInt(modelo);
    } catch (error) {
      this.logger.error(`Error al crear modelo: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        // Nota: Se elimina la validación/mapeo específico de duplicados (P2002)
        // para permitir nombres repetidos en el backend. Si existe una
        // restricción única en la base de datos, habrá que eliminarla vía
        // migración SQL. Mantenemos sólo el manejo de FK (P2003).
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Error de referencia: verificar IDs de marca, equipo o flota',
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Obteniendo todos los modelos');

    const modelos = await this.prisma.modelos.findMany({
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
        _count: {
          select: {
            machines: true,
            modelo_componentes_historico: true,
            ratios_historico: true,
          },
        },
      },
      orderBy: [{ marca: { nombre: 'asc' } }, { nombre: 'asc' }],
    });

    return serializeBigIntArray(modelos);
  }

  async findOne(id: number) {
    this.logger.log(`Buscando modelo con ID: ${id}`);

    const modelo = await this.prisma.modelos.findUnique({
      where: { id },
      include: {
        marca: true,
        equipo: true,
        flota: true,
        machines: {
          include: {
            informe_costo_horario: {
              select: {
                id: true,
                fecha_calculo: true,
              },
              orderBy: {
                fecha_calculo: 'desc',
              },
              take: 1,
            },
          },
        },
        modelo_componentes_historico: {
          include: {
            componente: true,
          },
          orderBy: {
            fecha_efectiva: 'desc',
          },
        },
        ratios_historico: {
          include: {
            tipo_ratio: true,
          },
          orderBy: {
            fecha_efectiva: 'desc',
          },
        },
      },
    });

    if (!modelo) {
      throw new NotFoundException(`Modelo con ID ${id} no encontrado`);
    }

    return serializeBigInt(modelo);
  }

  async update(id: number, updateModeloDto: UpdateModeloDto) {
    try {
      this.logger.log(`Actualizando modelo con ID: ${id}`);

      // Verificar que el modelo existe
      await this.findOne(id);

      // Verificar relaciones si se proporcionan
      if (updateModeloDto.marca_id) {
        const marca = await this.prisma.marcas.findUnique({
          where: { id: updateModeloDto.marca_id },
        });
        if (!marca) {
          throw new BadRequestException(
            `Marca con ID ${updateModeloDto.marca_id} no encontrada`,
          );
        }
      }

      if (updateModeloDto.equipo_id) {
        const equipo = await this.prisma.equipo.findUnique({
          where: { id: updateModeloDto.equipo_id },
        });
        if (!equipo) {
          throw new BadRequestException(
            `Equipo con ID ${updateModeloDto.equipo_id} no encontrado`,
          );
        }
      }

      if (updateModeloDto.flota_id) {
        const flota = await this.prisma.flota.findUnique({
          where: { id: updateModeloDto.flota_id },
        });
        if (!flota) {
          throw new BadRequestException(
            `Flota con ID ${updateModeloDto.flota_id} no encontrada`,
          );
        }
      }

      // **SIN CONVERSIÓN - USAR VALOR DIRECTO**
      const dataToUpdate = { ...updateModeloDto };

      const modelo = await this.prisma.modelos.update({
        where: { id },
        data: dataToUpdate,
        include: {
          marca: true,
          equipo: true,
          flota: true,
        },
      });

      this.logger.log(`Modelo actualizado: ${modelo.nombre}`);

      return serializeBigInt(modelo);
    } catch (error) {
      this.logger.error(`Error al actualizar modelo: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        // Se elimina el mapeo del error P2002 (duplicado) para no bloquear por nombre repetido
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Error de referencia: verificar IDs de marca, equipo o flota',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      this.logger.log(`Eliminando modelo con ID: ${id}`);

      // Verificar que el modelo existe
      await this.findOne(id);

      // Verificar dependencias
      const machinesCount = await this.prisma.machines.count({
        where: { modelo_id: id },
      });

      const componentesCount =
        await this.prisma.modeloComponentesHistorico.count({
          where: { modelo_id: id },
        });

      const ratiosCount = await this.prisma.ratiosHistorico.count({
        where: { modelo_id: id },
      });

      if (machinesCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar el modelo porque tiene ${machinesCount} máquinas asociadas`,
        );
      }

      if (componentesCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar el modelo porque tiene ${componentesCount} registros de componentes`,
        );
      }

      if (ratiosCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar el modelo porque tiene ${ratiosCount} registros de ratios`,
        );
      }

      const modelo = await this.prisma.modelos.delete({
        where: { id },
      });

      this.logger.log(`Modelo eliminado: ${modelo.nombre}`);
      return serializeBigInt(modelo);
    } catch (error) {
      this.logger.error(`Error al eliminar modelo: ${error.message}`);
      throw error;
    }
  }

  async getStatistics() {
    this.logger.log('Obteniendo estadísticas de modelos');

    const totalModelos = await this.prisma.modelos.count();

    const modelosPorMarca = await this.prisma.modelos.groupBy({
      by: ['marca_id'],
      _count: true,
      orderBy: {
        _count: {
          marca_id: 'desc',
        },
      },
      take: 5,
    });

    const marcasConModelos = await this.prisma.marcas.findMany({
      where: {
        id: { in: modelosPorMarca.map((m) => m.marca_id) },
      },
      select: { id: true, nombre: true },
    });

    const topMarcas = modelosPorMarca.map((item) => {
      const marca = marcasConModelos.find((m) => m.id === item.marca_id);
      return {
        marca_id: item.marca_id,
        marca_nombre: marca?.nombre || 'Desconocida',
        cantidad_modelos: item._count,
      };
    });

    const promedioUtilidad = await this.prisma.modelos.aggregate({
      _avg: {
        porcentaje_utilidad: true,
      },
    });

    const modelosConMaquinas = await this.prisma.modelos.count({
      where: {
        machines: {
          some: {},
        },
      },
    });

    return {
      total_modelos: totalModelos,
      modelos_con_maquinas: modelosConMaquinas,
      modelos_sin_maquinas: totalModelos - modelosConMaquinas,
      promedio_utilidad: promedioUtilidad._avg.porcentaje_utilidad || 0, // **SIN CONVERSIÓN**
      top_marcas: topMarcas,
    };
  }

  async findByMarca(marcaId: number) {
    this.logger.log(`Buscando modelos de la marca ID: ${marcaId}`);

    const modelos = await this.prisma.modelos.findMany({
      where: { marca_id: marcaId },
      include: {
        marca: true,
        equipo: true,
        flota: true,
        _count: {
          select: {
            machines: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return serializeBigIntArray(modelos);
  }

  async findByEquipo(equipoId: number) {
    this.logger.log(`Buscando modelos del equipo ID: ${equipoId}`);

    const modelos = await this.prisma.modelos.findMany({
      where: { equipo_id: equipoId },
      include: {
        marca: true,
        equipo: true,
        flota: true,
        _count: {
          select: {
            machines: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return serializeBigIntArray(modelos);
  }

  async findByFlota(flotaId: number) {
    this.logger.log(`Buscando modelos de la flota ID: ${flotaId}`);

    const modelos = await this.prisma.modelos.findMany({
      where: { flota_id: flotaId },
      include: {
        marca: true,
        equipo: true,
        flota: true,
        _count: {
          select: {
            machines: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return serializeBigIntArray(modelos);
  }
}
