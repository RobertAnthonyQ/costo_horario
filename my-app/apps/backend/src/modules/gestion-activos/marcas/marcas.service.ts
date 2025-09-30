import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  serializeBigInt,
  serializeBigIntArray,
} from '../../../utils/bigint-serializer';

@Injectable()
export class MarcasService {
  private readonly logger = new Logger(MarcasService.name);

  constructor(private prisma: PrismaService) {}

  async create(createMarcaDto: CreateMarcaDto) {
    try {
      this.logger.log(`Creando marca: ${createMarcaDto.nombre}`);

      const marca = await this.prisma.marcas.create({
        data: createMarcaDto,
      });

      this.logger.log(`Marca creada con ID: ${marca.id}`);
      return serializeBigInt(marca);
    } catch (error) {
      this.logger.error(`Error al crear marca: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Ya existe una marca con ese nombre');
        }
      }
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Obteniendo todas las marcas');

    const marcas = await this.prisma.marcas.findMany({
      include: {
        modelos: {
          include: {
            machines: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return serializeBigIntArray(marcas);
  }

  async findOne(id: number) {
    this.logger.log(`Buscando marca con ID: ${id}`);

    const marca = await this.prisma.marcas.findUnique({
      where: { id },
      include: {
        modelos: {
          include: {
            machines: true,
            equipo: true,
            flota: true,
          },
        },
      },
    });

    if (!marca) {
      throw new NotFoundException(`Marca con ID ${id} no encontrada`);
    }

    return serializeBigInt(marca);
  }

  async update(id: number, updateMarcaDto: UpdateMarcaDto) {
    try {
      this.logger.log(`Actualizando marca con ID: ${id}`);

      // Verificar que la marca existe
      await this.findOne(id);

      const marca = await this.prisma.marcas.update({
        where: { id },
        data: updateMarcaDto,
        include: {
          modelos: true,
        },
      });

      this.logger.log(`Marca actualizada: ${marca.nombre}`);
      return serializeBigInt(marca);
    } catch (error) {
      this.logger.error(`Error al actualizar marca: ${error.message}`);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Ya existe una marca con ese nombre');
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      this.logger.log(`Eliminando marca con ID: ${id}`);

      // Verificar que la marca existe
      await this.findOne(id);

      // Verificar si tiene modelos asociados
      const modelosCount = await this.prisma.modelos.count({
        where: { marca_id: id },
      });

      if (modelosCount > 0) {
        throw new Error(
          `No se puede eliminar la marca porque tiene ${modelosCount} modelos asociados`,
        );
      }

      const marca = await this.prisma.marcas.delete({
        where: { id },
      });

      this.logger.log(`Marca eliminada: ${marca.nombre}`);
      return serializeBigInt(marca);
    } catch (error) {
      this.logger.error(`Error al eliminar marca: ${error.message}`);
      throw error;
    }
  }

  async getStatistics() {
    this.logger.log('Obteniendo estadísticas de marcas');

    const totalMarcas = await this.prisma.marcas.count();
    const marcasConModelos = await this.prisma.marcas.count({
      where: {
        modelos: {
          some: {},
        },
      },
    });

    const topMarcas = await this.prisma.marcas.findMany({
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
      total_marcas: totalMarcas,
      marcas_con_modelos: marcasConModelos,
      marcas_sin_modelos: totalMarcas - marcasConModelos,
      top_marcas: topMarcas.map((marca) => ({
        id: marca.id,
        nombre: marca.nombre,
        cantidad_modelos: marca._count.modelos,
      })),
    };
  }
}
