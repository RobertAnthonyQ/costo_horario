import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RatiosHistoricoService } from './ratios-historico.service';
import { CreateRatiosHistoricoDto } from './dto/create-ratios-historico.dto';
import { UpdateRatiosHistoricoDto } from './dto/update-ratios-historico.dto';

@ApiTags('Ratios Histórico')
@ApiBearerAuth('JWT-auth')
@Controller('ratios-historico')
export class RatiosHistoricoController {
  constructor(
    private readonly ratiosHistoricoService: RatiosHistoricoService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo registro de ratio histórico',
    description:
      'Crea un nuevo registro histórico de ratio para un modelo específico. El campo ratios_version es completamente opcional y solo se guardará si se envía explícitamente.',
  })
  @ApiBody({ type: CreateRatiosHistoricoDto })
  @ApiResponse({
    status: 201,
    description: 'Ratio histórico creado exitosamente',
    schema: {
      example: {
        id: 1,
        modelo_id: 1,
        tipo_ratio_id: 1,
        valor: 0.85,
        fecha_efectiva: '2025-09-15T12:00:00.000Z',
        ratios_version: {
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          ratios: [
            {
              tipo_ratio_id: 1,
              tipo_ratio_nombre: 'Disponibilidad',
              valor: 0.85,
              categoria: 'Preventivo',
            },
            {
              tipo_ratio_id: 2,
              tipo_ratio_nombre: 'Utilización',
              valor: 0.75,
              categoria: 'Correctivo',
            },
          ],
          comentario: 'Versión inicial',
          usuario_id: 'user123',
        },
        lugar_operacion: 'Mina Norte - Sector A',
        modelo: {
          id: 1,
          nombre: 'CAT 320D',
          marca: {
            id: 1,
            nombre: 'Caterpillar',
          },
          equipo: {
            id: 1,
            nombre: 'Excavadora',
          },
        },
        tipo_ratio: {
          id: 1,
          nombre: 'Disponibilidad',
          categoria: 'Preventivo',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o referencias no encontradas',
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRatiosHistoricoDto: CreateRatiosHistoricoDto) {
    return this.ratiosHistoricoService.create(createRatiosHistoricoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los ratios históricos',
    description:
      'Retorna la lista completa de ratios históricos con sus relaciones ordenados por fecha descendente',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ratios históricos obtenida exitosamente',
    schema: {
      example: [
        {
          id: 1,
          modelo_id: 1,
          tipo_ratio_id: 1,
          valor: 0.85,
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          ratios_version: {
            fecha_efectiva: '2025-09-15T12:00:00.000Z',
            ratios: [
              {
                tipo_ratio_id: 1,
                tipo_ratio_nombre: 'Disponibilidad',
                valor: 0.85,
                categoria: 'Preventivo',
              },
            ],
            comentario: 'Versión mensual',
            usuario_id: 'user123',
          },
          lugar_operacion: 'Mina Norte - Sector A',
          modelo: {
            id: 1,
            nombre: 'CAT 320D',
            marca: { id: 1, nombre: 'Caterpillar' },
            equipo: { id: 1, nombre: 'Excavadora' },
            flota: { id: 1, nombre: 'Flota A' },
          },
          tipo_ratio: {
            id: 1,
            nombre: 'Disponibilidad',
            categoria: 'Preventivo',
          },
        },
      ],
    },
  })
  findAll() {
    return this.ratiosHistoricoService.findAll();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Obtener estadísticas de ratios históricos',
    description:
      'Retorna estadísticas generales sobre los ratios históricos del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        total_ratios: 150,
        top_tipos_ratio: [
          {
            tipo_ratio_id: 1,
            nombre: 'Disponibilidad',
            categoria: 'Preventivo',
            cantidad_registros: 45,
            valor_promedio: 0.82,
          },
        ],
        top_modelos: [
          {
            modelo_id: 1,
            nombre: 'CAT 320D',
            marca: 'Caterpillar',
            cantidad_registros: 25,
          },
        ],
      },
    },
  })
  getStatistics() {
    return this.ratiosHistoricoService.getStatistics();
  }

  @Get('by-modelo/:modeloId')
  @ApiOperation({
    summary: 'Obtener ratios históricos por modelo',
    description: 'Retorna todos los ratios históricos de un modelo específico',
  })
  @ApiParam({
    name: 'modeloId',
    description: 'ID del modelo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ratios históricos del modelo obtenidos exitosamente',
  })
  findByModelo(@Param('modeloId', ParseIntPipe) modeloId: number) {
    return this.ratiosHistoricoService.findByModelo(modeloId);
  }

  @Get('by-tipo-ratio/:tipoRatioId')
  @ApiOperation({
    summary: 'Obtener ratios históricos por tipo de ratio',
    description:
      'Retorna todos los ratios históricos de un tipo de ratio específico',
  })
  @ApiParam({
    name: 'tipoRatioId',
    description: 'ID del tipo de ratio',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ratios históricos del tipo de ratio obtenidos exitosamente',
  })
  findByTipoRatio(@Param('tipoRatioId', ParseIntPipe) tipoRatioId: number) {
    return this.ratiosHistoricoService.findByTipoRatio(tipoRatioId);
  }

  @Get('by-fecha-range')
  @ApiOperation({
    summary: 'Obtener ratios históricos por rango de fechas',
    description:
      'Retorna todos los ratios históricos en un rango de fechas específico',
  })
  @ApiQuery({
    name: 'fechaDesde',
    description: 'Fecha desde (ISO string)',
    type: String,
    example: '2025-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'fechaHasta',
    description: 'Fecha hasta (ISO string)',
    type: String,
    example: '2025-12-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description:
      'Ratios históricos en el rango de fechas obtenidos exitosamente',
  })
  findByFechaRange(
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.ratiosHistoricoService.findByFechaRange(fechaDesde, fechaHasta);
  }

  @Get('latest-by-modelo/:modeloId')
  @ApiOperation({
    summary: 'Obtener ratios más recientes por modelo',
    description:
      'Retorna el ratio más reciente de cada tipo para un modelo específico',
  })
  @ApiParam({
    name: 'modeloId',
    description: 'ID del modelo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ratios más recientes del modelo obtenidos exitosamente',
    schema: {
      example: [
        {
          id: 5,
          modelo_id: 1,
          tipo_ratio_id: 1,
          valor: 0.88,
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          ratios_version: {
            fecha_efectiva: '2025-09-15T12:00:00.000Z',
            ratios: [
              {
                tipo_ratio_id: 1,
                tipo_ratio_nombre: 'Disponibilidad',
                valor: 0.88,
                categoria: 'Preventivo',
              },
            ],
            comentario: 'Último ratio registrado',
            usuario_id: 'operator1',
          },
          lugar_operacion: 'Mina Centro - Sector C',
          modelo: {
            id: 1,
            nombre: 'CAT 320D',
            marca: { id: 1, nombre: 'Caterpillar' },
          },
          tipo_ratio: {
            id: 1,
            nombre: 'Disponibilidad',
            categoria: 'Preventivo',
          },
        },
      ],
    },
  })
  getLatestByModelo(@Param('modeloId', ParseIntPipe) modeloId: number) {
    return this.ratiosHistoricoService.getLatestByModelo(modeloId);
  }

  @Get('by-lugar-operacion')
  @ApiOperation({
    summary: 'Buscar ratios por lugar de operación',
    description:
      'Retorna todos los ratios históricos que coincidan con el lugar de operación especificado',
  })
  @ApiQuery({
    name: 'lugar',
    description: 'Lugar de operación a buscar',
    type: String,
    example: 'Mina Norte',
  })
  @ApiResponse({
    status: 200,
    description:
      'Ratios históricos por lugar de operación obtenidos exitosamente',
  })
  findByLugarOperacion(@Query('lugar') lugar: string) {
    return this.ratiosHistoricoService.findByLugarOperacion(lugar);
  }

  @Get('historiales')
  @ApiOperation({
    summary: 'Obtener todos los historiales completos',
    description:
      'Retorna solo los registros que son historiales completos (tipo_ratio_id = 100) con versiones JSON guardadas. Este endpoint es específico para obtener los snapshots completos del sistema.',
  })
  @ApiQuery({
    name: 'lugar',
    description: 'Filtrar por lugar de operación (opcional)',
    type: String,
    required: false,
    example: 'Mina Norte',
  })
  @ApiResponse({
    status: 200,
    description: 'Historiales completos obtenidos exitosamente',
    schema: {
      example: [
        {
          id: 11,
          modelo_id: 4,
          tipo_ratio_id: 100,
          valor: null,
          fecha_efectiva: '2025-09-24T12:00:00.000Z',
          lugar_operacion: 'Mina Norte - Sector A',
          ratios_version: {
            fecha_efectiva: '2025-09-24T12:00:00.000Z',
            ratios: [
              {
                tipo_ratio_id: 1,
                tipo_ratio_nombre: 'Mangueras',
                valor: 0.55,
                categoria: 'CORRECTIVO',
              },
            ],
            comentario: 'Historial guardado desde vista individual',
            usuario_id: 'frontend-user',
          },
          modelo: {
            id: 4,
            nombre: 'SmartRoc',
            marca: { nombre: 'EPIROC' },
          },
        },
      ],
    },
  })
  getHistoriales(@Query('lugar') lugar?: string) {
    return this.ratiosHistoricoService.getHistorialesCompletos(lugar);
  }

  @Get('versiones-json')
  @ApiOperation({
    summary:
      'Obtener todas las versiones JSON de ratios (historiales completos)',
    description:
      'Retorna todos los registros que tienen versiones JSON guardadas (solo tipo_ratio_id = 100). Para mayor claridad, use el endpoint /historiales que es más específico.',
  })
  @ApiQuery({
    name: 'lugar',
    description: 'Filtrar por lugar de operación (opcional)',
    type: String,
    required: false,
    example: 'Mina Norte',
  })
  @ApiResponse({
    status: 200,
    description: 'Versiones JSON obtenidas exitosamente',
    schema: {
      example: [
        {
          id: 1,
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          lugar_operacion: 'Mina Norte - Sector A',
          ratios_version: {
            fecha_efectiva: '2025-09-15T12:00:00.000Z',
            ratios: [
              {
                tipo_ratio_id: 1,
                tipo_ratio_nombre: 'Disponibilidad',
                valor: 0.85,
                categoria: 'Preventivo',
              },
              {
                tipo_ratio_id: 2,
                tipo_ratio_nombre: 'Utilización',
                valor: 0.75,
                categoria: 'Correctivo',
              },
            ],
            comentario: 'Versión mensual completa',
            usuario_id: 'user123',
          },
          modelo: {
            id: 1,
            nombre: 'CAT 320D',
            marca: { nombre: 'Caterpillar' },
            equipo: { nombre: 'Excavadora' },
            flota: { nombre: 'Flota A' },
          },
          tipo_ratio: {
            id: 1,
            nombre: 'Disponibilidad',
            categoria: 'Preventivo',
          },
        },
      ],
    },
  })
  getAllVersionesJson(@Query('lugar') lugar?: string) {
    return this.ratiosHistoricoService.getAllVersionesJson(lugar);
  }

  @Get('versiones-by-modelo/:modeloId')
  @ApiOperation({
    summary: 'Obtener historiales completos de ratios por modelo',
    description:
      'Retorna todos los historiales completos (tipo_ratio_id = 100) con versiones JSON para un modelo específico',
  })
  @ApiParam({
    name: 'modeloId',
    description: 'ID del modelo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Versiones de ratios obtenidas exitosamente',
    schema: {
      example: [
        {
          id: 1,
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          lugar_operacion: 'Mina Norte - Sector A',
          ratios_version: {
            fecha_efectiva: '2025-09-15T12:00:00.000Z',
            ratios: [
              {
                tipo_ratio_id: 1,
                tipo_ratio_nombre: 'Disponibilidad',
                valor: 0.85,
                categoria: 'Preventivo',
              },
              {
                tipo_ratio_id: 2,
                tipo_ratio_nombre: 'Utilización',
                valor: 0.75,
                categoria: 'Correctivo',
              },
            ],
            comentario: 'Versión mensual completa',
            usuario_id: 'user123',
          },
          modelo: {
            id: 1,
            nombre: 'CAT 320D',
            marca: { nombre: 'Caterpillar' },
          },
        },
      ],
    },
  })
  getRatiosVersionsByModelo(@Param('modeloId', ParseIntPipe) modeloId: number) {
    return this.ratiosHistoricoService.getRatiosVersionsByModelo(modeloId);
  }

  @Get('versiones-by-tipo-ratio/:tipoRatioId')
  @ApiOperation({
    summary: 'Buscar historiales que contengan un tipo de ratio específico',
    description:
      'Retorna todos los historiales completos (tipo_ratio_id = 100) que incluyan el tipo de ratio especificado en su contenido JSON',
  })
  @ApiParam({
    name: 'tipoRatioId',
    description: 'ID del tipo de ratio a buscar dentro de las versiones JSON',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Versiones JSON con el tipo de ratio encontradas exitosamente',
    schema: {
      example: [
        {
          id: 1,
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          lugar_operacion: 'Mina Norte - Sector A',
          ratios_version: {
            fecha_efectiva: '2025-09-15T12:00:00.000Z',
            ratios: [
              {
                tipo_ratio_id: 1,
                tipo_ratio_nombre: 'Disponibilidad',
                valor: 0.85,
                categoria: 'Preventivo',
              },
            ],
            comentario: 'Contiene el ratio de disponibilidad',
            usuario_id: 'user123',
          },
          modelo: {
            id: 1,
            nombre: 'CAT 320D',
            marca: { nombre: 'Caterpillar' },
          },
        },
      ],
    },
  })
  findVersionesByTipoRatio(
    @Param('tipoRatioId', ParseIntPipe) tipoRatioId: number,
  ) {
    return this.ratiosHistoricoService.findByTipoRatioInVersion(tipoRatioId);
  }

  @Post('create-complete-version/:modeloId')
  @ApiOperation({
    summary: 'Crear versión completa de ratios para un modelo',
    description:
      'ESTE endpoint SÍ genera automáticamente una versión JSON completa con todos los ratios más recientes del modelo especificado. Úsalo cuando quieras hacer un "snapshot" completo del estado actual. IMPORTANTE: Todos los historiales completos se guardan con tipo_ratio_id = 100 para identificarlos claramente.',
  })
  @ApiParam({
    name: 'modeloId',
    description: 'ID del modelo',
    type: Number,
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        comentario: {
          type: 'string',
          description: 'Comentario para la versión',
          example: 'Versión de fin de mes',
        },
        usuario_id: {
          type: 'string',
          description: 'ID del usuario que crea la versión',
          example: 'user123',
        },
        lugar_operacion: {
          type: 'string',
          description: 'Lugar de operación',
          example: 'Mina Norte - Sector A',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Versión completa de ratios creada exitosamente',
  })
  async createCompleteRatiosVersion(
    @Param('modeloId', ParseIntPipe) modeloId: number,
    @Body()
    body: {
      comentario?: string;
      usuario_id?: string;
      lugar_operacion?: string;
    },
  ) {
    // Usar la fecha/hora REAL actual (no agregar tiempo aleatorio aquí)
    const fechaEfectiva = new Date().toISOString();

    const ratiosVersion =
      await this.ratiosHistoricoService.createCompleteRatiosVersion(
        modeloId,
        fechaEfectiva,
        body.comentario,
        body.usuario_id,
      );

    // Crear un registro con la versión completa
    const createDto: CreateRatiosHistoricoDto = {
      modelo_id: modeloId,
      tipo_ratio_id: 100, // ID especial para identificar historiales completos
      valor: undefined, // Para historiales no necesitamos valor específico
      fecha_efectiva: fechaEfectiva,
      ratios_version: ratiosVersion,
      lugar_operacion: body.lugar_operacion,
    };

    return this.ratiosHistoricoService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un ratio histórico por ID',
    description:
      'Retorna los detalles completos de un ratio histórico específico con todas sus relaciones',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del ratio histórico',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ratio histórico encontrado',
    schema: {
      example: {
        id: 1,
        modelo_id: 1,
        tipo_ratio_id: 1,
        valor: 0.85,
        fecha_efectiva: '2025-09-15T12:00:00.000Z',
        ratios_version: {
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          ratios: [
            {
              tipo_ratio_id: 1,
              tipo_ratio_nombre: 'Disponibilidad',
              valor: 0.85,
              categoria: 'Preventivo',
            },
            {
              tipo_ratio_id: 2,
              tipo_ratio_nombre: 'Utilización',
              valor: 0.75,
              categoria: 'Correctivo',
            },
          ],
          comentario: 'Versión detallada con múltiples ratios',
          usuario_id: 'user123',
        },
        lugar_operacion: 'Mina Norte - Sector A',
        modelo: {
          id: 1,
          nombre: 'CAT 320D',
          marca: { id: 1, nombre: 'Caterpillar' },
          equipo: { id: 1, nombre: 'Excavadora' },
          flota: { id: 1, nombre: 'Flota A' },
          machines: [
            {
              id: 1,
              estado: 'activo',
              id_equipo_interno: 'EQ-001',
            },
          ],
        },
        tipo_ratio: {
          id: 1,
          nombre: 'Disponibilidad',
          categoria: 'Preventivo',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Ratio histórico no encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ratiosHistoricoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un ratio histórico',
    description: 'Actualiza los datos de un ratio histórico existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del ratio histórico a actualizar',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateRatiosHistoricoDto })
  @ApiResponse({
    status: 200,
    description: 'Ratio histórico actualizado exitosamente',
    schema: {
      example: {
        id: 1,
        modelo_id: 1,
        tipo_ratio_id: 1,
        valor: 0.9,
        fecha_efectiva: '2025-09-15T12:00:00.000Z',
        ratios_version: {
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          ratios: [
            {
              tipo_ratio_id: 1,
              tipo_ratio_nombre: 'Disponibilidad',
              valor: 0.9,
              categoria: 'Preventivo',
            },
          ],
          comentario: 'Actualización tras mejoras',
          usuario_id: 'user456',
        },
        lugar_operacion: 'Mina Sur - Sector B',
        modelo: {
          id: 1,
          nombre: 'CAT 320D',
          marca: { id: 1, nombre: 'Caterpillar' },
        },
        tipo_ratio: {
          id: 1,
          nombre: 'Disponibilidad',
          categoria: 'Preventivo',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Ratio histórico no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o referencias no encontradas',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRatiosHistoricoDto: UpdateRatiosHistoricoDto,
  ) {
    return this.ratiosHistoricoService.update(id, updateRatiosHistoricoDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un ratio histórico',
    description: 'Elimina un registro de ratio histórico del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del ratio histórico a eliminar',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Ratio histórico eliminado exitosamente',
    schema: {
      example: {
        id: 1,
        modelo_id: 1,
        tipo_ratio_id: 1,
        valor: 0.85,
        fecha_efectiva: '2025-09-15T12:00:00.000Z',
        ratios_version: {
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          ratios: [
            {
              tipo_ratio_id: 1,
              tipo_ratio_nombre: 'Disponibilidad',
              valor: 0.85,
              categoria: 'Preventivo',
            },
          ],
          comentario: 'Registro eliminado',
          usuario_id: 'admin',
        },
        lugar_operacion: 'Mina Norte - Sector A',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Ratio histórico no encontrado',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ratiosHistoricoService.remove(id);
  }
}
