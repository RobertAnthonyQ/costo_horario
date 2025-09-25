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
import { Prisma } from '@prisma/client';
import {
  RatiosVersion,
  RatioVersionItem,
} from './interfaces/ratios-version.interface';

@Injectable()
export class RatiosHistoricoService {
  private readonly logger = new Logger(RatiosHistoricoService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Valida y completa la versión JSON si se proporciona
   */
  private validateRatiosVersion(
    createDto: CreateRatiosHistoricoDto,
  ): RatiosVersion | null {
    if (!createDto.ratios_version) {
      return null;
    }

    // Si viene con ratios_version, validamos que tenga fecha_efectiva
    if (!createDto.ratios_version.fecha_efectiva) {
      createDto.ratios_version.fecha_efectiva = createDto.fecha_efectiva;
    }

    return createDto.ratios_version;
  }

  /**
   * Obtiene todos los ratios actuales de un modelo para crear una versión completa
   */
  async createCompleteRatiosVersion(
    modeloId: number,
    fechaEfectiva: string,
    comentario?: string,
    usuarioId?: string,
  ): Promise<RatiosVersion> {
    const ratiosActuales = await this.getLatestByModelo(modeloId);

    const ratios: RatioVersionItem[] = ratiosActuales.map((ratio) => ({
      tipo_ratio_id: ratio.tipo_ratio_id,
      tipo_ratio_nombre: ratio.tipo_ratio.nombre,
      valor: ratio.valor,
      categoria: ratio.tipo_ratio.categoria,
    }));

    return {
      fecha_efectiva: fechaEfectiva,
      ratios,
      comentario: comentario || 'Versión completa de ratios',
      usuario_id: usuarioId,
    };
  }

  /**
   * Método auxiliar para crear con reintentos en caso de constraint único para historiales
   */
  private async createWithRetry(
    createRatiosHistoricoDto: CreateRatiosHistoricoDto,
    intentos: number = 0,
  ): Promise<any> {
    console.log(`🔄 CREATE WITH RETRY - Intento ${intentos + 1}`);
    const maxIntentos = 3;

    try {
      this.logger.log(
        `Intento ${intentos + 1}/${maxIntentos}: creando historial...`,
      );
      return await this.createDirecto(createRatiosHistoricoDto);
    } catch (error) {
      this.logger.error(`Error en intento ${intentos + 1}: ${error.message}`);

      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        createRatiosHistoricoDto.tipo_ratio_id === 100
      ) {
        if (intentos + 1 < maxIntentos) {
          // Generar una nueva fecha ligeramente distinta
          const fechaOriginal = new Date(
            createRatiosHistoricoDto.fecha_efectiva,
          );
          const milisegundosOffset =
            (intentos + 1) * 1000 + Math.floor(Math.random() * 1000);
          const nuevaFecha = new Date(
            fechaOriginal.getTime() + milisegundosOffset,
          ).toISOString();

          const dtoConNuevaFecha: CreateRatiosHistoricoDto = {
            ...createRatiosHistoricoDto,
            fecha_efectiva: nuevaFecha,
            ratios_version: createRatiosHistoricoDto.ratios_version
              ? ({
                  ...createRatiosHistoricoDto.ratios_version,
                  fecha_efectiva: nuevaFecha,
                } as any)
              : createRatiosHistoricoDto.ratios_version,
          };

          this.logger.warn(
            `P2002 detectado. Reintentando con nueva fecha: ${nuevaFecha}`,
          );
          return await this.createWithRetry(dtoConNuevaFecha, intentos + 1);
        }

        // Último recurso: intentar con una fecha futura para evitar redondeos
        const ultimaFecha = new Date(
          Date.now() + 60_000 + Math.floor(Math.random() * 1000),
        ).toISOString();
        const dtoFinal: CreateRatiosHistoricoDto = {
          ...createRatiosHistoricoDto,
          fecha_efectiva: ultimaFecha,
          ratios_version: createRatiosHistoricoDto.ratios_version
            ? ({
                ...createRatiosHistoricoDto.ratios_version,
                fecha_efectiva: ultimaFecha,
              } as any)
            : createRatiosHistoricoDto.ratios_version,
        };
        this.logger.warn(
          `P2002 persiste. Intento final con fecha futura: ${ultimaFecha}`,
        );
        try {
          return await this.createDirecto(dtoFinal);
        } catch (e2) {
          if (
            e2 instanceof PrismaClientKnownRequestError &&
            e2.code === 'P2002'
          ) {
            this.logger.error(
              'Persisten conflictos únicos tras múltiples intentos. Abortando creación.',
            );
            throw new BadRequestException(
              'No se pudo crear una nueva versión porque ya existe un registro con la misma fecha. Intenta nuevamente para generar una nueva marca de tiempo.',
            );
          }
          throw e2;
        }
      }

      // Si es cualquier otro error, fallar inmediatamente
      throw error;
    }
  }

  /**
   * Método directo de creación sin manejo de reintentos
   */
  private async createDirecto(
    createRatiosHistoricoDto: CreateRatiosHistoricoDto,
  ) {
    try {
      // Log de los datos recibidos para debug
      this.logger.log(`Datos recibidos para crear:`, {
        modelo_id: createRatiosHistoricoDto.modelo_id,
        tipo_ratio_id: createRatiosHistoricoDto.tipo_ratio_id,
        valor: createRatiosHistoricoDto.valor,
        fecha_efectiva: createRatiosHistoricoDto.fecha_efectiva,
        lugar_operacion: createRatiosHistoricoDto.lugar_operacion,
        tiene_ratios_version: !!createRatiosHistoricoDto.ratios_version,
      });

      // Para historiales, verificar registros existentes
      if (createRatiosHistoricoDto.tipo_ratio_id === 100) {
        const existentes = await this.prisma.ratiosHistorico.findMany({
          where: {
            modelo_id: createRatiosHistoricoDto.modelo_id,
            tipo_ratio_id: 100,
          },
          select: { id: true, fecha_efectiva: true },
          orderBy: { fecha_efectiva: 'desc' },
          take: 5,
        });

        this.logger.log(
          `Encontrados ${existentes.length} historiales existentes para modelo ${createRatiosHistoricoDto.modelo_id}`,
        );
      }

      // Verificar que el modelo existe
      console.log(
        '🔍 VERIFICANDO MODELO ID:',
        createRatiosHistoricoDto.modelo_id,
      );
      const modelo = await this.prisma.modelos.findUnique({
        where: { id: createRatiosHistoricoDto.modelo_id },
        include: { marca: true },
      });
      if (!modelo) {
        console.log(
          '❌ MODELO NO ENCONTRADO:',
          createRatiosHistoricoDto.modelo_id,
        );
        this.logger.error(
          `Modelo no encontrado: ${createRatiosHistoricoDto.modelo_id}`,
        );
        throw new BadRequestException(
          `Modelo con ID ${createRatiosHistoricoDto.modelo_id} no encontrado`,
        );
      }
      console.log('✅ MODELO ENCONTRADO:', modelo.nombre);

      // Verificar que el tipo de ratio existe
      console.log(
        '🔍 VERIFICANDO TIPO_RATIO_ID:',
        createRatiosHistoricoDto.tipo_ratio_id,
      );
      let tipoRatio = await this.prisma.tiposRatio.findUnique({
        where: { id: createRatiosHistoricoDto.tipo_ratio_id },
      });

      // Si es tipo_ratio_id = 100 y no existe, crearlo automáticamente
      if (!tipoRatio && createRatiosHistoricoDto.tipo_ratio_id === 100) {
        console.log('🔧 CREANDO TIPO_RATIO_ID = 100...');
        this.logger.log(
          'Creando tipo_ratio_id = 100 para historiales completos...',
        );
        try {
          tipoRatio = await this.prisma.tiposRatio.create({
            data: {
              id: 100,
              nombre: 'Historial Completo',
              categoria: 'Preventivo',
            },
          });
          console.log('✅ TIPO_RATIO_ID 100 CREADO EXITOSAMENTE');
          this.logger.log('Tipo de ratio 100 creado exitosamente');
        } catch (createError) {
          console.log(
            '❌ ERROR CREANDO TIPO_RATIO_ID 100:',
            createError.message,
          );
          this.logger.error(
            `Error creando tipo_ratio_id 100: ${createError.message}`,
          );
          // Intentar obtenerlo de nuevo por si otro proceso ya lo creó
          tipoRatio = await this.prisma.tiposRatio.findUnique({
            where: { id: 100 },
          });
          if (tipoRatio) {
            console.log(
              '✅ TIPO_RATIO_ID 100 EXISTE (creado por otro proceso)',
            );
          }
        }
      }

      if (!tipoRatio) {
        console.log(
          '❌ TIPO_RATIO NO ENCONTRADO:',
          createRatiosHistoricoDto.tipo_ratio_id,
        );
        this.logger.error(
          `Tipo de ratio no encontrado: ${createRatiosHistoricoDto.tipo_ratio_id}`,
        );
        throw new BadRequestException(
          `Tipo de ratio con ID ${createRatiosHistoricoDto.tipo_ratio_id} no encontrado`,
        );
      }
      console.log('✅ TIPO_RATIO ENCONTRADO:', tipoRatio.nombre);

      // Validar la versión JSON solo si se proporciona
      const ratiosVersion = this.validateRatiosVersion(
        createRatiosHistoricoDto,
      );

      // Validar que la fecha sea válida
      const fechaEfectiva = new Date(createRatiosHistoricoDto.fecha_efectiva);
      if (isNaN(fechaEfectiva.getTime())) {
        this.logger.error(
          `Fecha inválida: ${createRatiosHistoricoDto.fecha_efectiva}`,
        );
        throw new BadRequestException('La fecha efectiva no es válida');
      }

      // Preparar datos para la inserción
      const dataToCreate: any = {
        modelo_id: createRatiosHistoricoDto.modelo_id,
        tipo_ratio_id: createRatiosHistoricoDto.tipo_ratio_id,
        fecha_efectiva: fechaEfectiva,
      };

      // Solo incluir valor si no es undefined
      if (createRatiosHistoricoDto.valor !== undefined) {
        dataToCreate.valor = createRatiosHistoricoDto.valor;
      }

      // Solo incluir lugar_operacion si está presente
      if (createRatiosHistoricoDto.lugar_operacion) {
        dataToCreate.lugar_operacion = createRatiosHistoricoDto.lugar_operacion;
      }

      // Solo incluir ratios_version si hay una versión válida
      if (ratiosVersion) {
        dataToCreate.ratios_version = ratiosVersion as any;
      } else {
        dataToCreate.ratios_version = Prisma.JsonNull;
      }

      console.log('📝 DATOS FINALES PARA PRISMA:');
      console.log('📝 dataToCreate:', JSON.stringify(dataToCreate, null, 2));

      this.logger.log('Intentando crear registro en base de datos...');

      console.log('🔄 EJECUTANDO PRISMA CREATE...');
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

      console.log('✅ PRISMA CREATE EXITOSO - ID:', ratioHistorico.id);
      this.logger.log(
        `Registro creado exitosamente con ID: ${ratioHistorico.id}`,
      );
      return ratioHistorico;
    } catch (error) {
      this.logger.error('Error en createDirecto:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        clientVersion: error.clientVersion,
      });

      // Relanzar el error para que sea manejado por el método que lo llama
      throw error;
    }
  }

  async create(createRatiosHistoricoDto: CreateRatiosHistoricoDto) {
    try {
      console.log('🔥 CREATE RATIOS HISTORICO - INICIO');
      console.log(
        '📥 DTO RECIBIDO:',
        JSON.stringify(createRatiosHistoricoDto, null, 2),
      );

      this.logger.log(
        `Creando ratio histórico para modelo ID: ${createRatiosHistoricoDto.modelo_id}, tipo ratio ID: ${createRatiosHistoricoDto.tipo_ratio_id}`,
      );

      // Validación inicial de datos requeridos
      console.log('✅ Validando datos requeridos...');
      if (!createRatiosHistoricoDto.modelo_id) {
        console.log('❌ ERROR: modelo_id es requerido');
        throw new BadRequestException('modelo_id es requerido');
      }
      if (!createRatiosHistoricoDto.tipo_ratio_id) {
        console.log('❌ ERROR: tipo_ratio_id es requerido');
        throw new BadRequestException('tipo_ratio_id es requerido');
      }
      if (!createRatiosHistoricoDto.fecha_efectiva) {
        console.log('❌ ERROR: fecha_efectiva es requerida');
        throw new BadRequestException('fecha_efectiva es requerida');
      }
      console.log('✅ Datos requeridos válidos');

      // Para historiales (tipo_ratio_id = 100), usar método con reintentos
      if (createRatiosHistoricoDto.tipo_ratio_id === 100) {
        console.log('🔄 USANDO MÉTODO CON REINTENTOS (tipo_ratio_id = 100)');
        const resultado = await this.createWithRetry(createRatiosHistoricoDto);
        console.log('✅ Historial completo creado exitosamente:', resultado.id);
        this.logger.log(`Historial completo creado con ID: ${resultado.id}`);
        return resultado;
      }

      // Para ratios individuales, usar método directo
      console.log('🔄 USANDO MÉTODO DIRECTO (ratio individual)');
      const resultado = await this.createDirecto(createRatiosHistoricoDto);
      console.log('✅ Ratio individual creado exitosamente:', resultado.id);
      this.logger.log(`Ratio histórico creado con ID: ${resultado.id}`);
      return resultado;
    } catch (error) {
      console.log('❌ ERROR EN CREATE RATIOS HISTORICO:');
      console.log('🔍 Error message:', error.message);
      console.log('🔍 Error code:', error.code);
      console.log('🔍 Error meta:', error.meta);
      console.log('🔍 Error stack:', error.stack);
      console.log('🔍 Error completo:', JSON.stringify(error, null, 2));

      this.logger.error(`Error al crear ratio histórico:`, {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
        datos: {
          modelo_id: createRatiosHistoricoDto.modelo_id,
          tipo_ratio_id: createRatiosHistoricoDto.tipo_ratio_id,
          fecha_efectiva: createRatiosHistoricoDto.fecha_efectiva,
        },
      });

      if (error instanceof PrismaClientKnownRequestError) {
        console.log('🔍 ES ERROR DE PRISMA CONOCIDO');
        this.logger.error(
          `Error de Prisma - Código: ${error.code}`,
          error.meta,
        );

        if (error.code === 'P2002') {
          console.log('🔍 Error P2002 - Constraint único violado');
          throw new BadRequestException(
            'Ya existe un registro con esa combinación de modelo, tipo de ratio y fecha. Intenta con una fecha ligeramente diferente.',
          );
        }
        if (error.code === 'P2003') {
          console.log('🔍 Error P2003 - Constraint de referencia violado');
          throw new BadRequestException(
            `Error de referencia: El modelo ID ${createRatiosHistoricoDto.modelo_id} o el tipo de ratio ID ${createRatiosHistoricoDto.tipo_ratio_id} no existen en la base de datos.`,
          );
        }
        if (error.code === 'P2025') {
          console.log('🔍 Error P2025 - Registro no encontrado');
          throw new BadRequestException(
            'No se pudo crear el registro. Verificar que todos los IDs de referencia existan.',
          );
        }
      } else {
        console.log('🔍 NO ES ERROR DE PRISMA CONOCIDO');
        console.log('🔍 Tipo de error:', typeof error);
        console.log('🔍 Constructor del error:', error.constructor.name);
      }

      // Si es un BadRequestException ya formateado, lo relanzamos
      if (error instanceof BadRequestException) {
        console.log('🔍 ES BadRequestException, relanzando...');
        throw error;
      }

      // Para cualquier otro error, dar un mensaje genérico pero útil
      console.log('🔍 LANZANDO ERROR GENÉRICO');
      throw new BadRequestException(
        `No se pudo guardar el historial. Error de base de datos: ${error.message}`,
      );
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

      // Si se proporciona ratios_version y no tiene fecha_efectiva, usar la fecha actual o la del DTO
      if (
        dataToUpdate.ratios_version &&
        !dataToUpdate.ratios_version.fecha_efectiva
      ) {
        dataToUpdate.ratios_version.fecha_efectiva = dataToUpdate.fecha_efectiva
          ? new Date(dataToUpdate.fecha_efectiva).toISOString()
          : new Date().toISOString();
      }

      // Convertir ratios_version para Prisma si existe
      if (dataToUpdate.ratios_version) {
        (dataToUpdate as any).ratios_version =
          dataToUpdate.ratios_version as any;
      }

      const ratioHistorico = await this.prisma.ratiosHistorico.update({
        where: { id },
        data: dataToUpdate as any,
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

  /**
   * Busca ratios por lugar de operación
   */
  async findByLugarOperacion(lugarOperacion: string) {
    this.logger.log(`Buscando ratios históricos del lugar: ${lugarOperacion}`);

    return this.prisma.ratiosHistorico.findMany({
      where: {
        lugar_operacion: {
          contains: lugarOperacion,
          mode: 'insensitive',
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
        tipo_ratio: true,
      },
      orderBy: [{ fecha_efectiva: 'desc' }, { modelo: { nombre: 'asc' } }],
    });
  }

  /**
   * Obtiene todas las versiones JSON de ratios, opcionalmente filtradas por lugar
   */
  async getAllVersionesJson(lugarOperacion?: string) {
    this.logger.log('Obteniendo todas las versiones JSON de ratios');

    const whereCondition: any = {
      ratios_version: {
        not: Prisma.JsonNull,
      },
      tipo_ratio_id: 100, // Solo historiales completos
    };

    if (lugarOperacion) {
      whereCondition.lugar_operacion = {
        contains: lugarOperacion,
        mode: 'insensitive',
      };
    }

    return this.prisma.ratiosHistorico.findMany({
      where: whereCondition,
      select: {
        id: true,
        fecha_efectiva: true,
        lugar_operacion: true,
        ratios_version: true,
        modelo: {
          select: {
            id: true,
            nombre: true,
            marca: {
              select: {
                id: true,
                nombre: true,
              },
            },
            equipo: {
              select: {
                id: true,
                nombre: true,
              },
            },
            flota: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        tipo_ratio: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
          },
        },
      },
      orderBy: [
        { fecha_efectiva: 'desc' },
        { lugar_operacion: 'asc' },
        { modelo: { nombre: 'asc' } },
      ],
    });
  }

  /**
   * Obtiene específicamente solo los historiales completos (tipo_ratio_id = 100)
   * Método dedicado para obtener únicamente los snapshots completos del sistema
   */
  async getHistorialesCompletos(lugar?: string) {
    this.logger.log('Obteniendo historiales completos (tipo_ratio_id = 100)');

    const whereCondition: any = {
      tipo_ratio_id: 100, // Solo historiales completos
      ratios_version: {
        not: Prisma.JsonNull,
      },
    };

    if (lugar) {
      whereCondition.lugar_operacion = {
        contains: lugar,
        mode: 'insensitive',
      };
    }

    return this.prisma.ratiosHistorico.findMany({
      where: whereCondition,
      select: {
        id: true,
        modelo_id: true,
        tipo_ratio_id: true,
        valor: true,
        fecha_efectiva: true,
        lugar_operacion: true,
        ratios_version: true,
        modelo: {
          select: {
            id: true,
            nombre: true,
            marca: {
              select: {
                id: true,
                nombre: true,
              },
            },
            equipo: {
              select: {
                id: true,
                nombre: true,
              },
            },
            flota: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        tipo_ratio: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
          },
        },
      },
      orderBy: [
        { fecha_efectiva: 'desc' },
        { lugar_operacion: 'asc' },
        { modelo: { nombre: 'asc' } },
      ],
    });
  }

  /**
   * Obtiene las versiones JSON de ratios para un modelo
   */
  async getRatiosVersionsByModelo(modeloId: number) {
    this.logger.log(
      `Obteniendo versiones de ratios del modelo ID: ${modeloId}`,
    );

    const ratiosConVersiones = await this.prisma.ratiosHistorico.findMany({
      where: {
        modelo_id: modeloId,
        ratios_version: {
          not: Prisma.JsonNull,
        },
        tipo_ratio_id: 100, // Solo historiales completos
      },
      select: {
        id: true,
        fecha_efectiva: true,
        ratios_version: true,
        lugar_operacion: true,
        modelo: {
          select: {
            id: true,
            nombre: true,
            marca: { select: { nombre: true } },
          },
        },
      },
      orderBy: {
        fecha_efectiva: 'desc',
      },
    });

    return ratiosConVersiones;
  }

  /**
   * Busca ratios que contengan un tipo específico en su versión JSON
   */
  async findByTipoRatioInVersion(tipoRatioId: number) {
    this.logger.log(
      `Buscando ratios que contengan el tipo ${tipoRatioId} en sus versiones JSON`,
    );

    const ratios = await this.prisma.ratiosHistorico.findMany({
      where: {
        ratios_version: {
          path: ['ratios'],
          array_contains: [{ tipo_ratio_id: tipoRatioId }],
        },
        tipo_ratio_id: 100, // Solo historiales completos
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
      orderBy: {
        fecha_efectiva: 'desc',
      },
    });

    return ratios;
  }

  async getStatistics() {
    this.logger.log('Obteniendo estadísticas de ratios históricos');

    const totalRatios = await this.prisma.ratiosHistorico.count();

    // Contar registros con versiones JSON
    const totalConVersiones = await this.prisma.ratiosHistorico.count({
      where: {
        ratios_version: {
          not: Prisma.JsonNull,
        },
      },
    });

    // Estadísticas por lugar de operación
    const ratiosPorLugar = await this.prisma.ratiosHistorico.groupBy({
      by: ['lugar_operacion'],
      _count: true,
      where: {
        lugar_operacion: {
          not: null,
        },
      },
      orderBy: {
        _count: {
          lugar_operacion: 'desc',
        },
      },
      take: 5,
    });

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

    const topLugaresOperacion = ratiosPorLugar.map((item) => ({
      lugar_operacion: item.lugar_operacion || 'Sin especificar',
      cantidad_registros: item._count,
    }));

    return {
      total_ratios: totalRatios,
      total_con_versiones: totalConVersiones,
      porcentaje_con_versiones:
        totalRatios > 0
          ? Math.round((totalConVersiones / totalRatios) * 100)
          : 0,
      top_tipos_ratio: topTiposRatio,
      top_modelos: topModelos,
      top_lugares_operacion: topLugaresOperacion,
    };
  }
}
