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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ModelosService } from './modelos.service';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';

@ApiTags('Modelos')
@ApiBearerAuth('JWT-auth')
@Controller('modelos')
export class ModelosController {
  constructor(private readonly modelosService: ModelosService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo modelo',
    description:
      'Crea un nuevo modelo asociado a una marca, opcionalmente a un equipo y flota',
  })
  @ApiBody({ type: CreateModeloDto })
  @ApiResponse({
    status: 201,
    description: 'Modelo creado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'CAT 320D',
        marca_id: 1,
        equipo_id: 1,
        flota_id: 1,
        porcentaje_utilidad: 15.5,
        vida_util_fabricante: 10,
        created_at: '2025-09-13T12:00:00.000Z',
        marca: {
          id: 1,
          nombre: 'Caterpillar',
        },
        equipo: {
          id: 1,
          nombre: 'Excavadora',
        },
        flota: {
          id: 1,
          nombre: 'Flota Minería',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o referencias no encontradas',
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createModeloDto: CreateModeloDto) {
    return this.modelosService.create(createModeloDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los modelos',
    description:
      'Retorna la lista completa de modelos con sus relaciones y conteos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de modelos obtenida exitosamente',
    schema: {
      example: [
        {
          id: 1,
          nombre: 'CAT 320D',
          marca_id: 1,
          equipo_id: 1,
          flota_id: 1,
          porcentaje_utilidad: 15.5,
          vida_util_fabricante: 10,
          created_at: '2025-09-13T12:00:00.000Z',
          marca: { id: 1, nombre: 'Caterpillar' },
          equipo: { id: 1, nombre: 'Excavadora' },
          flota: { id: 1, nombre: 'Flota Minería' },
          machines: [
            {
              id: 1,
              estado: 'activo',
              id_equipo_interno: 'EQ-001',
            },
          ],
          _count: {
            machines: 5,
            modelo_componentes_historico: 12,
            ratios_historico: 8,
          },
        },
      ],
    },
  })
  findAll() {
    return this.modelosService.findAll();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Obtener estadísticas de modelos',
    description: 'Retorna estadísticas generales sobre los modelos del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        total_modelos: 50,
        modelos_con_maquinas: 42,
        modelos_sin_maquinas: 8,
        promedio_utilidad: 18.5,
        top_marcas: [
          {
            marca_id: 1,
            marca_nombre: 'Caterpillar',
            cantidad_modelos: 25,
          },
        ],
      },
    },
  })
  getStatistics() {
    return this.modelosService.getStatistics();
  }

  @Get('by-marca/:marcaId')
  @ApiOperation({
    summary: 'Obtener modelos por marca',
    description: 'Retorna todos los modelos de una marca específica',
  })
  @ApiParam({
    name: 'marcaId',
    description: 'ID de la marca',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Modelos de la marca obtenidos exitosamente',
  })
  findByMarca(@Param('marcaId', ParseIntPipe) marcaId: number) {
    return this.modelosService.findByMarca(marcaId);
  }

  @Get('by-equipo/:equipoId')
  @ApiOperation({
    summary: 'Obtener modelos por equipo',
    description: 'Retorna todos los modelos de un tipo de equipo específico',
  })
  @ApiParam({
    name: 'equipoId',
    description: 'ID del equipo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Modelos del equipo obtenidos exitosamente',
  })
  findByEquipo(@Param('equipoId', ParseIntPipe) equipoId: number) {
    return this.modelosService.findByEquipo(equipoId);
  }

  @Get('by-flota/:flotaId')
  @ApiOperation({
    summary: 'Obtener modelos por flota',
    description: 'Retorna todos los modelos de una flota específica',
  })
  @ApiParam({
    name: 'flotaId',
    description: 'ID de la flota',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Modelos de la flota obtenidos exitosamente',
  })
  findByFlota(@Param('flotaId', ParseIntPipe) flotaId: number) {
    return this.modelosService.findByFlota(flotaId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un modelo por ID',
    description:
      'Retorna los detalles completos de un modelo específico con todas sus relaciones',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del modelo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Modelo encontrado',
    schema: {
      example: {
        id: 1,
        nombre: 'CAT 320D',
        marca_id: 1,
        equipo_id: 1,
        flota_id: 1,
        porcentaje_utilidad: 15.5,
        vida_util_fabricante: 10,
        created_at: '2025-09-13T12:00:00.000Z',
        marca: { id: 1, nombre: 'Caterpillar' },
        equipo: { id: 1, nombre: 'Excavadora' },
        flota: { id: 1, nombre: 'Flota Minería' },
        machines: [
          {
            id: 1,
            estado: 'activo',
            informe_costo_horario: [
              {
                id: 1,
                fecha_calculo: '2025-09-13T10:00:00.000Z',
              },
            ],
          },
        ],
        modelo_componentes_historico: [
          {
            id: 1,
            monto_usd: 5000,
            pcr: 0.15,
            distribucion: 0.25,
            fecha_efectiva: '2025-09-13T12:00:00.000Z',
            componente: {
              id: 1,
              nombre: 'Motor',
            },
          },
        ],
        ratios_historico: [
          {
            id: 1,
            valor: 0.85,
            fecha_efectiva: '2025-09-13T12:00:00.000Z',
            tipo_ratio: {
              id: 1,
              nombre: 'Disponibilidad',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Modelo no encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modelosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un modelo',
    description: 'Actualiza los datos de un modelo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del modelo a actualizar',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateModeloDto })
  @ApiResponse({
    status: 200,
    description: 'Modelo actualizado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'CAT 320DL',
        marca_id: 1,
        equipo_id: 1,
        flota_id: 1,
        porcentaje_utilidad: 20.0,
        vida_util_fabricante: 12,
        created_at: '2025-09-13T12:00:00.000Z',
        marca: { id: 1, nombre: 'Caterpillar' },
        equipo: { id: 1, nombre: 'Excavadora' },
        flota: { id: 1, nombre: 'Flota Minería' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Modelo no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o referencias no encontradas',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModeloDto: UpdateModeloDto,
  ) {
    return this.modelosService.update(id, updateModeloDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un modelo',
    description:
      'Elimina un modelo del sistema. No se puede eliminar si tiene máquinas o registros históricos asociados',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del modelo a eliminar',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Modelo eliminado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'CAT 320D',
        marca_id: 1,
        created_at: '2025-09-13T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Modelo no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar el modelo porque tiene dependencias',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modelosService.remove(id);
  }
}
