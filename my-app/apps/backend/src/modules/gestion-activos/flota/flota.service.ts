import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateFlotaDto } from './dto/create-flota.dto';
import { UpdateFlotaDto } from './dto/update-flota.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class FlotaService {
  private readonly logger = new Logger(FlotaService.name);

  constructor(private prisma: PrismaService) {}

  async create(createFlotaDto: CreateFlotaDto) {
    try {
      this.logger.log(`Creando flota: ${createFlotaDto.nombre}`);

      const flota = await this.prisma.flota.create({
        data: createFlotaDto,
      });

      this.logger.log(`Flota creada con ID: ${flota.id}`);
      return flota;
    } catch (error) {
      this.logger.error(`Error al crear flota: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Ya existe una flota con ese nombre');
        }
      }
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Obteniendo todas las flotas');

    return this.prisma.flota.findMany({
      include: {
        modelos: {
          include: {
            marca: true,
            equipo: true,
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
    this.logger.log(`Buscando flota con ID: ${id}`);

    const flota = await this.prisma.flota.findUnique({
      where: { id },
      include: {
        modelos: {
          include: {
            marca: true,
            equipo: true,
            machines: true,
          },
        },
      },
    });

    if (!flota) {
      throw new NotFoundException(`Flota con ID ${id} no encontrada`);
    }

    return flota;
  }

  async update(id: number, updateFlotaDto: UpdateFlotaDto) {
    try {
      this.logger.log(`Actualizando flota con ID: ${id}`);

      // Verificar que la flota existe
      await this.findOne(id);

      const flota = await this.prisma.flota.update({
        where: { id },
        data: updateFlotaDto,
        include: {
          modelos: true,
        },
      });

      this.logger.log(`Flota actualizada: ${flota.nombre}`);
      return flota;
    } catch (error) {
      this.logger.error(`Error al actualizar flota: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Ya existe una flota con ese nombre');
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      this.logger.log(`Eliminando flota con ID: ${id}`);

      // Verificar que la flota existe
      await this.findOne(id);

      // Verificar si tiene modelos asociados
      const modelosCount = await this.prisma.modelos.count({
        where: { flota_id: id },
      });

      if (modelosCount > 0) {
        throw new Error(
          `No se puede eliminar la flota porque tiene ${modelosCount} modelos asociados`,
        );
      }

      const flota = await this.prisma.flota.delete({
        where: { id },
      });

      this.logger.log(`Flota eliminada: ${flota.nombre}`);
      return flota;
    } catch (error) {
      this.logger.error(`Error al eliminar flota: ${error.message}`);
      throw error;
    }
  }

  async getStatistics() {
    this.logger.log('Obteniendo estadísticas de flotas');

    const totalFlotas = await this.prisma.flota.count();
    const flotasConModelos = await this.prisma.flota.count({
      where: {
        modelos: {
          some: {},
        },
      },
    });

    const topFlotas = await this.prisma.flota.findMany({
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
      total_flotas: totalFlotas,
      flotas_con_modelos: flotasConModelos,
      flotas_sin_modelos: totalFlotas - flotasConModelos,
      top_flotas: topFlotas.map((flota) => ({
        id: flota.id,
        nombre: flota.nombre,
        cantidad_modelos: flota._count.modelos,
      })),
    };
  }
}
