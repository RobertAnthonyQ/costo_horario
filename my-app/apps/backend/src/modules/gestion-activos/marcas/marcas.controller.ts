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
import { MarcasService } from './marcas.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';

@ApiTags('Marcas')
@ApiBearerAuth('JWT-auth')
@Controller('marcas')
export class MarcasController {
  constructor(private readonly marcasService: MarcasService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva marca',
    description: 'Crea una nueva marca en el sistema',
  })
  @ApiBody({ type: CreateMarcaDto })
  @ApiResponse({
    status: 201,
    description: 'Marca creada exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Caterpillar',
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
    description: 'Ya existe una marca con ese nombre',
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMarcaDto: CreateMarcaDto) {
    return this.marcasService.create(createMarcaDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las marcas',
    description:
      'Retorna la lista completa de marcas con sus modelos asociados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de marcas obtenida exitosamente',
    schema: {
      example: [
        {
          id: 1,
          nombre: 'Caterpillar',
          created_at: '2025-09-09T12:00:00.000Z',
          modelos: [
            {
              id: 1,
              nombre: 'CAT 320',
              marca_id: 1,
              machines: [],
            },
          ],
        },
      ],
    },
  })
  findAll() {
    return this.marcasService.findAll();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Obtener estadísticas de marcas',
    description: 'Retorna estadísticas generales sobre las marcas del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        total_marcas: 10,
        marcas_con_modelos: 8,
        marcas_sin_modelos: 2,
        top_marcas: [
          {
            id: 1,
            nombre: 'Caterpillar',
            cantidad_modelos: 15,
          },
        ],
      },
    },
  })
  getStatistics() {
    return this.marcasService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una marca por ID',
    description:
      'Retorna los detalles de una marca específica con sus modelos y máquinas',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la marca',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Marca encontrada',
    schema: {
      example: {
        id: 1,
        nombre: 'Caterpillar',
        created_at: '2025-09-09T12:00:00.000Z',
        modelos: [
          {
            id: 1,
            nombre: 'CAT 320',
            marca_id: 1,
            equipo: { id: 1, nombre: 'Excavadora' },
            flota: { id: 1, nombre: 'Flota A' },
            machines: [],
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Marca no encontrada',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.marcasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una marca',
    description: 'Actualiza los datos de una marca existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la marca a actualizar',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateMarcaDto })
  @ApiResponse({
    status: 200,
    description: 'Marca actualizada exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Caterpillar Inc.',
        created_at: '2025-09-09T12:00:00.000Z',
        modelos: [],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Marca no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una marca con ese nombre',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMarcaDto: UpdateMarcaDto,
  ) {
    return this.marcasService.update(id, updateMarcaDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una marca',
    description:
      'Elimina una marca del sistema. No se puede eliminar si tiene modelos asociados',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la marca a eliminar',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Marca eliminada exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Caterpillar',
        created_at: '2025-09-09T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Marca no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar la marca porque tiene modelos asociados',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.marcasService.remove(id);
  }
}
