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
import { EquipoService } from './equipo.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';

@ApiTags('Equipos')
@Controller('equipos')
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo equipo',
    description: 'Crea un nuevo tipo de equipo en el sistema',
  })
  @ApiBody({ type: CreateEquipoDto })
  @ApiResponse({
    status: 201,
    description: 'Equipo creado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Excavadora',
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
    description: 'Ya existe un equipo con ese nombre',
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createEquipoDto: CreateEquipoDto) {
    return this.equipoService.create(createEquipoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los equipos',
    description:
      'Retorna la lista completa de equipos con sus modelos asociados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de equipos obtenida exitosamente',
    schema: {
      example: [
        {
          id: 1,
          nombre: 'Excavadora',
          created_at: '2025-09-09T12:00:00.000Z',
          modelos: [
            {
              id: 1,
              nombre: 'CAT 320',
              equipo_id: 1,
              marca: {
                id: 1,
                nombre: 'Caterpillar',
              },
              machines: [],
            },
          ],
        },
      ],
    },
  })
  findAll() {
    return this.equipoService.findAll();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Obtener estadísticas de equipos',
    description: 'Retorna estadísticas generales sobre los equipos del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        total_equipos: 10,
        equipos_con_modelos: 8,
        equipos_sin_modelos: 2,
        top_equipos: [
          {
            id: 1,
            nombre: 'Excavadora',
            cantidad_modelos: 15,
          },
        ],
      },
    },
  })
  getStatistics() {
    return this.equipoService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un equipo por ID',
    description:
      'Retorna los detalles de un equipo específico con sus modelos y máquinas',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del equipo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Equipo encontrado',
    schema: {
      example: {
        id: 1,
        nombre: 'Excavadora',
        created_at: '2025-09-09T12:00:00.000Z',
        modelos: [
          {
            id: 1,
            nombre: 'CAT 320',
            equipo_id: 1,
            marca: { id: 1, nombre: 'Caterpillar' },
            flota: { id: 1, nombre: 'Flota A' },
            machines: [],
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Equipo no encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un equipo',
    description: 'Actualiza los datos de un equipo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del equipo a actualizar',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateEquipoDto })
  @ApiResponse({
    status: 200,
    description: 'Equipo actualizado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Excavadora Hidráulica',
        created_at: '2025-09-09T12:00:00.000Z',
        modelos: [],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Equipo no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un equipo con ese nombre',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipoDto: UpdateEquipoDto,
  ) {
    return this.equipoService.update(id, updateEquipoDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un equipo',
    description:
      'Elimina un equipo del sistema. No se puede eliminar si tiene modelos asociados',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del equipo a eliminar',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Equipo eliminado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Excavadora',
        created_at: '2025-09-09T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Equipo no encontrado',
  })
  @ApiResponse({
    status: 400,
    description:
      'No se puede eliminar el equipo porque tiene modelos asociados',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equipoService.remove(id);
  }
}
