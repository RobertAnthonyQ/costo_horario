import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class EquipoService {
  private readonly logger = new Logger(EquipoService.name);

  constructor(private prisma: PrismaService) {}

  async create(createEquipoDto: CreateEquipoDto) {
    try {
      this.logger.log(`Creando equipo: ${createEquipoDto.nombre}`);

      const equipo = await this.prisma.equipo.create({
        data: createEquipoDto,
      });

      this.logger.log(`Equipo creado con ID: ${equipo.id}`);
      return equipo;
    } catch (error) {
      this.logger.error(`Error al crear equipo: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Ya existe un equipo con ese nombre');
        }
      }
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Obteniendo todos los equipos');

    return this.prisma.equipo.findMany({
      include: {
        modelos: {
          include: {
            marca: true,
            machines: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async findOne(id: number) {
    this.logger.log(`Buscando equipo con ID: ${id}`);

    const equipo = await this.prisma.equipo.findUnique({
      where: { id },
      include: {
        modelos: {
          include: {
            marca: true,
            flota: true,
            machines: true,
          },
        },
      },
    });

    if (!equipo) {
      throw new NotFoundException(`Equipo con ID ${id} no encontrado`);
    }

    return equipo;
  }

  async update(id: number, updateEquipoDto: UpdateEquipoDto) {
    try {
      this.logger.log(`Actualizando equipo con ID: ${id}`);

      // Verificar que el equipo existe
      await this.findOne(id);

      const equipo = await this.prisma.equipo.update({
        where: { id },
        data: updateEquipoDto,
        include: {
          modelos: true,
        },
      });

      this.logger.log(`Equipo actualizado: ${equipo.nombre}`);
      return equipo;
    } catch (error) {
      this.logger.error(`Error al actualizar equipo: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Ya existe un equipo con ese nombre');
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      this.logger.log(`Eliminando equipo con ID: ${id}`);

      // Verificar que el equipo existe
      await this.findOne(id);

      // Verificar si tiene modelos asociados
      const modelosCount = await this.prisma.modelos.count({
        where: { equipo_id: id },
      });

      if (modelosCount > 0) {
        throw new Error(
          `No se puede eliminar el equipo porque tiene ${modelosCount} modelos asociados`,
        );
      }

      const equipo = await this.prisma.equipo.delete({
        where: { id },
      });

      this.logger.log(`Equipo eliminado: ${equipo.nombre}`);
      return equipo;
    } catch (error) {
      this.logger.error(`Error al eliminar equipo: ${error.message}`);
      throw error;
    }
  }

  async getStatistics() {
    this.logger.log('Obteniendo estadísticas de equipos');

    const totalEquipos = await this.prisma.equipo.count();
    const equiposConModelos = await this.prisma.equipo.count({
      where: {
        modelos: {
          some: {},
        },
      },
    });

    const topEquipos = await this.prisma.equipo.findMany({
      include: {
        _count: {
          select: {
            modelos: true,
          },
        },
      },
      orderBy: {
        modelos: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      total_equipos: totalEquipos,
      equipos_con_modelos: equiposConModelos,
      equipos_sin_modelos: totalEquipos - equiposConModelos,
      top_equipos: topEquipos.map((equipo) => ({
        id: equipo.id,
        nombre: equipo.nombre,
        cantidad_modelos: equipo._count.modelos,
      })),
    };
  }
}
