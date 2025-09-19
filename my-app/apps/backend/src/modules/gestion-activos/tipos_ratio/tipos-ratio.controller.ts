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
import { TiposRatioService } from './tipos-ratio.service';
import {
  CreateTiposRatioDto,
  TipoRatioCategoria,
} from './dto/create-tipos-ratio.dto';
import { UpdateTiposRatioDto } from './dto/update-tipos-ratio.dto';

@ApiTags('Tipos de Ratio')
@Controller('tipos-ratio')
export class TiposRatioController {
  constructor(private readonly tiposRatioService: TiposRatioService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo tipo de ratio',
    description: 'Crea un nuevo tipo de ratio en el sistema',
  })
  @ApiBody({ type: CreateTiposRatioDto })
  @ApiResponse({
    status: 201,
    description: 'Tipo de ratio creado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Disponibilidad',
        categoria: 'Preventivo',
        created_at: '2025-09-15T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un tipo de ratio con ese nombre',
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTiposRatioDto: CreateTiposRatioDto) {
    return this.tiposRatioService.create(createTiposRatioDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los tipos de ratio',
    description:
      'Retorna la lista completa de tipos de ratio con conteo de registros históricos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos de ratio obtenida exitosamente',
    schema: {
      example: [
        {
          id: 1,
          nombre: 'Disponibilidad',
          categoria: 'Preventivo',
          created_at: '2025-09-15T12:00:00.000Z',
          _count: {
            ratios_historico: 25,
          },
        },
        {
          id: 2,
          nombre: 'Eficiencia',
          categoria: 'Correctivo',
          created_at: '2025-09-15T13:00:00.000Z',
          _count: {
            ratios_historico: 18,
          },
        },
      ],
    },
  })
  findAll() {
    return this.tiposRatioService.findAll();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Obtener estadísticas de tipos de ratio',
    description:
      'Retorna estadísticas generales sobre los tipos de ratio del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        total_tipos_ratio: 15,
        tipos_ratio_con_historico: 12,
        tipos_ratio_sin_historico: 3,
        estadisticas_por_categoria: [
          {
            categoria: 'Preventivo',
            cantidad: 8,
          },
          {
            categoria: 'Correctivo',
            cantidad: 4,
          },
        ],
        top_tipos_ratio: [
          {
            id: 1,
            nombre: 'Disponibilidad',
            categoria: 'Preventivo',
            cantidad_registros: 45,
          },
        ],
      },
    },
  })
  getStatistics() {
    return this.tiposRatioService.getStatistics();
  }

  @Get('by-categoria')
  @ApiOperation({
    summary: 'Obtener tipos de ratio por categoría',
    description: 'Retorna todos los tipos de ratio de una categoría específica',
  })
  @ApiQuery({
    name: 'categoria',
    description: 'Categoría de los tipos de ratio',
    enum: TipoRatioCategoria,
    example: TipoRatioCategoria.Preventivo,
  })
  @ApiResponse({
    status: 200,
    description: 'Tipos de ratio de la categoría obtenidos exitosamente',
  })
  findByCategoria(@Query('categoria') categoria: string) {
    return this.tiposRatioService.findByCategoria(categoria);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un tipo de ratio por ID',
    description:
      'Retorna los detalles de un tipo de ratio específico con sus registros históricos',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del tipo de ratio',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tipo de ratio encontrado',
    schema: {
      example: {
        id: 1,
        nombre: 'Disponibilidad',
        categoria: 'Preventivo',
        created_at: '2025-09-15T12:00:00.000Z',
        ratios_historico: [
          {
            id: 1,
            valor: 0.85,
            fecha_efectiva: '2025-09-15T10:00:00.000Z',
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
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de ratio no encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tiposRatioService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un tipo de ratio',
    description: 'Actualiza los datos de un tipo de ratio existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del tipo de ratio a actualizar',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateTiposRatioDto })
  @ApiResponse({
    status: 200,
    description: 'Tipo de ratio actualizado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Disponibilidad Mejorada',
        categoria: 'Preventivo',
        created_at: '2025-09-15T12:00:00.000Z',
        _count: {
          ratios_historico: 25,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de ratio no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un tipo de ratio con ese nombre',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTiposRatioDto: UpdateTiposRatioDto,
  ) {
    return this.tiposRatioService.update(id, updateTiposRatioDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un tipo de ratio',
    description:
      'Elimina un tipo de ratio del sistema. No se puede eliminar si tiene registros históricos asociados',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del tipo de ratio a eliminar',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tipo de ratio eliminado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Disponibilidad',
        categoria: 'Preventivo',
        created_at: '2025-09-15T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de ratio no encontrado',
  })
  @ApiResponse({
    status: 400,
    description:
      'No se puede eliminar el tipo de ratio porque tiene registros históricos asociados',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tiposRatioService.remove(id);
  }
}
