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
} from '@nestjs/swagger';
import { FlotaService } from './flota.service';
import { CreateFlotaDto } from './dto/create-flota.dto';
import { UpdateFlotaDto } from './dto/update-flota.dto';

@ApiTags('Flotas')
@Controller('flotas')
export class FlotaController {
  constructor(private readonly flotaService: FlotaService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva flota',
    description: 'Crea una nueva flota en el sistema',
  })
  @ApiBody({ type: CreateFlotaDto })
  @ApiResponse({
    status: 201,
    description: 'Flota creada exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Flota Minería',
        created_at: '2025-09-09T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una flota con ese nombre',
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFlotaDto: CreateFlotaDto) {
    return this.flotaService.create(createFlotaDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las flotas',
    description:
      'Retorna la lista completa de flotas con sus modelos asociados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de flotas obtenida exitosamente',
    schema: {
      example: [
        {
          id: 1,
          nombre: 'Flota Minería',
          created_at: '2025-09-09T12:00:00.000Z',
          modelos: [
            {
              id: 1,
              nombre: 'CAT 320',
              flota_id: 1,
              marca: {
                id: 1,
                nombre: 'Caterpillar',
              },
              equipo: {
                id: 1,
                nombre: 'Excavadora',
              },
              machines: [],
            },
          ],
        },
      ],
    },
  })
  findAll() {
    return this.flotaService.findAll();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Obtener estadísticas de flotas',
    description: 'Retorna estadísticas generales sobre las flotas del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        total_flotas: 10,
        flotas_con_modelos: 8,
        flotas_sin_modelos: 2,
        top_flotas: [
          {
            id: 1,
            nombre: 'Flota Minería',
            cantidad_modelos: 15,
          },
        ],
      },
    },
  })
  getStatistics() {
    return this.flotaService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una flota por ID',
    description:
      'Retorna los detalles de una flota específica con sus modelos y máquinas',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la flota',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Flota encontrada',
    schema: {
      example: {
        id: 1,
        nombre: 'Flota Minería',
        created_at: '2025-09-09T12:00:00.000Z',
        modelos: [
          {
            id: 1,
            nombre: 'CAT 320',
            flota_id: 1,
            marca: { id: 1, nombre: 'Caterpillar' },
            equipo: { id: 1, nombre: 'Excavadora' },
            machines: [],
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Flota no encontrada',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.flotaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una flota',
    description: 'Actualiza los datos de una flota existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la flota a actualizar',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateFlotaDto })
  @ApiResponse({
    status: 200,
    description: 'Flota actualizada exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Flota Minería Industrial',
        created_at: '2025-09-09T12:00:00.000Z',
        modelos: [],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Flota no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una flota con ese nombre',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFlotaDto: UpdateFlotaDto,
  ) {
    return this.flotaService.update(id, updateFlotaDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una flota',
    description:
      'Elimina una flota del sistema. No se puede eliminar si tiene modelos asociados',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la flota a eliminar',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Flota eliminada exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Flota Minería',
        created_at: '2025-09-09T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Flota no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar la flota porque tiene modelos asociados',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.flotaService.remove(id);
  }
}
