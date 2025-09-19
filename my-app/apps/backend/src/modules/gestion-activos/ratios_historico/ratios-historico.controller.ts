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
} from '@nestjs/swagger';
import { RatiosHistoricoService } from './ratios-historico.service';
import { CreateRatiosHistoricoDto } from './dto/create-ratios-historico.dto';
import { UpdateRatiosHistoricoDto } from './dto/update-ratios-historico.dto';

@ApiTags('Ratios Histórico')
@Controller('ratios-historico')
export class RatiosHistoricoController {
  constructor(
    private readonly ratiosHistoricoService: RatiosHistoricoService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo registro de ratio histórico',
    description:
      'Crea un nuevo registro histórico de ratio para un modelo específico',
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
