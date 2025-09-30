/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateMachinesDto } from './dto/create-machines.dto';
import { UpdateMachinesDto } from './dto/update-machines.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ModelosService } from '../modelos/modelos.service';
import {
  serializeBigInt,
  serializeBigIntArray,
} from '../../../utils/bigint-serializer';

// Tipo flexible para simplificar reglas del linter en métodos con includes complejos
type MachineWithRelations = any;

@Injectable()
export class MachinesService {
  private readonly logger = new Logger(MachinesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelosService: ModelosService,
  ) {}

  async create(
    createMachinesDto: CreateMachinesDto,
  ): Promise<MachineWithRelations> {
    try {
      this.logger.log('Iniciando creación de máquina...');

      // Función para convertir a número o devolver null si no es válido
      const parseNumber = (value: any): number | null => {
        if (value === null || value === undefined) return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      };

      let modeloId: number | bigint | undefined = createMachinesDto.modelo_id;
      let modeloCreated: any = null;

      // Si se proporciona modelo_data, crear el modelo automáticamente
      if (createMachinesDto.modelo_data && !modeloId) {
        this.logger.log('Creando modelo automáticamente...');

        const nuevoModelo = await this.modelosService.create({
          nombre: createMachinesDto.modelo_data.nombre,
          marca_id: createMachinesDto.modelo_data.marca_id,
          equipo_id: createMachinesDto.modelo_data.equipo_id,
          flota_id: createMachinesDto.modelo_data.flota_id,
          porcentaje_utilidad:
            createMachinesDto.modelo_data.porcentaje_utilidad,
          vida_util_fabricante:
            createMachinesDto.modelo_data.vida_util_fabricante,
        });

        modeloId = nuevoModelo.id;
        modeloCreated = nuevoModelo;
        this.logger.log(`Modelo creado con ID: ${modeloId}`);
      }

      // Generar código automático id_equipo_interno
      let idEquipoInterno = '';

      if (createMachinesDto.modelo_data || modeloCreated) {
        // Para nueva máquina con modelo recién creado
        const {
          marca_id,
          equipo_id,
          nombre: modeloNombre,
        } = createMachinesDto.modelo_data || modeloCreated;

        // Obtener datos de marca y equipo para generar el código
        const [marca, equipo] = await Promise.all([
          this.prisma.marcas.findUnique({ where: { id: marca_id } }),
          this.prisma.equipo.findUnique({ where: { id: equipo_id } }),
        ]);

        if (marca && equipo) {
          // Generar código: EQUIPO-MARCA-MODELO (primeras 3 letras de cada uno)
          const equipoCodigo = equipo.nombre.slice(0, 3).toUpperCase();
          const marcaCodigo = marca.nombre.slice(0, 3).toUpperCase();
          const modeloCodigo = (modeloNombre || 'MOD')
            .slice(0, 3)
            .toUpperCase();

          // Obtener siguiente número secuencial para este tipo
          const count = await this.prisma.machines.count({
            where: {
              id_equipo_interno: {
                startsWith: `${equipoCodigo}-${marcaCodigo}-${modeloCodigo}`,
              },
            },
          });

          idEquipoInterno = `${equipoCodigo}-${marcaCodigo}-${modeloCodigo}-${String(count + 1).padStart(3, '0')}`;
        }
      } else if (modeloId) {
        // Para máquina con modelo existente
        const modeloExistente = await this.prisma.modelos.findUnique({
          where: { id: Number(modeloId) },
          include: {
            marca: true,
            equipo: true,
          },
        });

        if (modeloExistente?.marca && modeloExistente?.equipo) {
          const equipoCodigo = modeloExistente.equipo.nombre
            .slice(0, 3)
            .toUpperCase();
          const marcaCodigo = modeloExistente.marca.nombre
            .slice(0, 3)
            .toUpperCase();
          const modeloCodigo = modeloExistente.nombre.slice(0, 3).toUpperCase();

          const count = await this.prisma.machines.count({
            where: {
              id_equipo_interno: {
                startsWith: `${equipoCodigo}-${marcaCodigo}-${modeloCodigo}`,
              },
            },
          });

          idEquipoInterno = `${equipoCodigo}-${marcaCodigo}-${modeloCodigo}-${String(count + 1).padStart(3, '0')}`;
        }
      }

      // Validar y limpiar datos para evitar errores de formato binario
      const cleanData: any = {
        estado: createMachinesDto.estado || null,
        horometro_inicial: parseNumber(createMachinesDto.horometro_inicial),
        id_equipo_interno: idEquipoInterno || null, // Código generado automáticamente
        link_imagen: createMachinesDto.link_imagen || null,
        politica_depreciacion: parseNumber(
          createMachinesDto.politica_depreciacion,
        ),
        tiempo_entrega: parseNumber(createMachinesDto.tiempo_entrega),
        valor_similar_nuevo: parseNumber(createMachinesDto.valor_similar_nuevo),
        valor_venta: parseNumber(createMachinesDto.valor_venta),
        vida_util: parseNumber(createMachinesDto.vida_util),
        otros_json: createMachinesDto.otros_json ?? undefined,
      };

      // Manejar modelo_id - conectar si se proporciona un valor válido
      if (modeloId !== undefined && modeloId !== null) {
        cleanData.modelo = { connect: { id: Number(modeloId) } };
      }

      this.logger.debug(
        'Cleaned Data for Prisma:',
        JSON.stringify(cleanData, null, 2),
      );

      // Crear la máquina sin include primero
      const machine = await this.prisma.machines.create({
        data: cleanData,
      });

      // Luego hacer un findUnique con include para obtener las relaciones
      const machineWithRelations = await this.prisma.machines.findUnique({
        where: { id: machine.id },
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
              flota: true,
            },
          },
        },
      });

      this.logger.log(
        `Machine created with ID: ${machine.id}, Code: ${idEquipoInterno}`,
      );

      // Convertir automáticamente todos los BigInt a Number
      return serializeBigInt(machineWithRelations);
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException('Modelo no encontrado');
        }
      }
      this.logger.error('Error creating machine:', error);
      throw error;
    }
  }

  async findAll(): Promise<MachineWithRelations[]> {
    try {
      const machines = await this.prisma.machines.findMany({
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
              flota: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Convertir automáticamente todos los BigInt a Number
      return serializeBigIntArray(machines);
    } catch (error: unknown) {
      this.logger.error('Error finding all machines:', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<MachineWithRelations> {
    try {
      const machine = await this.prisma.machines.findUnique({
        where: { id },
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
              flota: true,
            },
          },
        },
      });

      if (!machine) {
        throw new NotFoundException(`Machine with ID ${id} not found`);
      }

      // Convertir automáticamente todos los BigInt a Number
      return serializeBigInt(machine);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding machine ${id}:`, error);
      throw error;
    }
  }

  async update(
    id: number,
    updateMachinesDto: UpdateMachinesDto,
  ): Promise<MachineWithRelations> {
    try {
      // Verificar que la máquina existe
      await this.findOne(id);

      // Preparar datos de actualización
      const updateData: any = {
        estado: updateMachinesDto.estado,
        horometro_inicial: updateMachinesDto.horometro_inicial,
        link_imagen: updateMachinesDto.link_imagen,
        politica_depreciacion: updateMachinesDto.politica_depreciacion,
        tiempo_entrega: updateMachinesDto.tiempo_entrega,
        valor_similar_nuevo: updateMachinesDto.valor_similar_nuevo,
        valor_venta: updateMachinesDto.valor_venta,
        vida_util: updateMachinesDto.vida_util,
        otros_json: updateMachinesDto.otros_json ?? undefined,
      };

      // Manejar modelo_id opcional en actualización
      if (updateMachinesDto.modelo_id !== undefined) {
        if (updateMachinesDto.modelo_id !== null) {
          updateData.modelo = {
            connect: { id: Number(updateMachinesDto.modelo_id) },
          };
        } else {
          updateData.modelo = { disconnect: true };
        }
      }

      const machine = await this.prisma.machines.update({
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
        },
      });

      this.logger.log(`Machine ${id} updated successfully`);

      // Convertir automáticamente todos los BigInt a Number
      return serializeBigInt(machine);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException('Modelo no encontrado');
        }
      }
      this.logger.error(`Error updating machine ${id}:`, error);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Verificar que la máquina existe
      await this.findOne(id);

      await this.prisma.machines.delete({
        where: { id },
      });

      this.logger.log(`Machine ${id} deleted successfully`);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error(
            'No se puede eliminar la máquina porque tiene registros relacionados',
          );
        }
      }
      this.logger.error(`Error deleting machine ${id}:`, error);
      throw error;
    }
  }

  // Métodos adicionales útiles
  async findByModelo(modeloId: number): Promise<MachineWithRelations[]> {
    try {
      const machines = await this.prisma.machines.findMany({
        where: { modelo_id: modeloId },
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
              flota: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Convertir automáticamente todos los BigInt a Number
      return serializeBigIntArray(machines);
    } catch (error: unknown) {
      this.logger.error(`Error finding machines by modelo ${modeloId}:`, error);
      throw error;
    }
  }

  async findByEstado(estado: string): Promise<MachineWithRelations[]> {
    try {
      const machines = await this.prisma.machines.findMany({
        where: { estado },
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
              flota: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Convertir automáticamente todos los BigInt a Number
      return serializeBigIntArray(machines);
    } catch (error: unknown) {
      this.logger.error(`Error finding machines by estado ${estado}:`, error);
      throw error;
    }
  }

  // Método para buscar con filtros múltiples
  async findWithFilters(filters: {
    modelo_id?: number;
    estado?: string;
    marca_id?: number;
    valor_min?: number;
    valor_max?: number;
  }): Promise<MachineWithRelations[]> {
    try {
      const whereClause: any = {};

      if (filters.modelo_id) {
        whereClause.modelo_id = filters.modelo_id;
      }

      if (filters.estado) {
        whereClause.estado = filters.estado;
      }

      if (filters.marca_id) {
        whereClause.modelo = {
          marca_id: filters.marca_id,
        };
      }

      if (filters.valor_min || filters.valor_max) {
        whereClause.valor_similar_nuevo = {};
        if (filters.valor_min) {
          whereClause.valor_similar_nuevo.gte = filters.valor_min;
        }
        if (filters.valor_max) {
          whereClause.valor_similar_nuevo.lte = filters.valor_max;
        }
      }

      const machines = await this.prisma.machines.findMany({
        where: whereClause,
        include: {
          modelo: {
            include: {
              marca: true,
              equipo: true,
              flota: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Convertir automáticamente todos los BigInt a Number
      return serializeBigIntArray(machines);
    } catch (error: unknown) {
      this.logger.error('Error finding machines with filters:', error);
      throw error;
    }
  }

  // Método para obtener estadísticas
  async getStatistics() {
    try {
      const [total, byEstado, avgValue] = await Promise.all([
        this.prisma.machines.count(),
        this.prisma.machines.groupBy({
          by: ['estado'],
          _count: true,
        }),
        this.prisma.machines.aggregate({
          _avg: {
            valor_similar_nuevo: true,
            valor_venta: true,
          },
        }),
      ]);

      return {
        total,
        byEstado,
        averageValues: avgValue._avg,
      };
    } catch (error: unknown) {
      this.logger.error('Error getting machine statistics:', error);
      throw error;
    }
  }
}
