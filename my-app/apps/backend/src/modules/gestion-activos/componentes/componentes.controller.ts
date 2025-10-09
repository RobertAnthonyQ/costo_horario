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
import { ComponentesService } from './componentes.service';
import { CreateComponenteDto } from './dto/create-componente.dto';
import { UpdateComponenteDto } from './dto/update-componente.dto';

@ApiTags('Componentes')
@ApiBearerAuth('JWT-auth') // ✅ Requiere autenticación para todo el controlador
@Controller('componentes')
export class ComponentesController {
  constructor(private readonly componentesService: ComponentesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo componente',
    description: 'Crea un nuevo componente en el sistema',
  })
  @ApiBody({ type: CreateComponenteDto })
  @ApiResponse({
    status: 201,
    description: 'Componente creado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Motor',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un componente con ese nombre',
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createComponenteDto: CreateComponenteDto) {
    return this.componentesService.create(createComponenteDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los componentes',
    description:
      'Retorna la lista completa de componentes con sus registros históricos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de componentes obtenida exitosamente',
    schema: {
      example: [
        {
          id: 1,
          nombre: 'Motor',
          modelo_componentes_historico: [
            {
              id: 1,
              modelo_id: 1,
              componente_id: 1,
              monto_usd: 5000.0,
              pcr: 0.15,
              distribucion: 0.25,
              fecha_efectiva: '2025-09-09T12:00:00.000Z',
              modelo: {
                id: 1,
                nombre: 'CAT 320',
                marca: { id: 1, nombre: 'Caterpillar' },
                equipo: { id: 1, nombre: 'Excavadora' },
                flota: { id: 1, nombre: 'Flota A' },
              },
            },
          ],
        },
      ],
    },
  })
  findAll() {
    return this.componentesService.findAll();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Obtener estadísticas de componentes',
    description:
      'Retorna estadísticas generales sobre los componentes del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        total_componentes: 50,
        componentes_con_historicos: 42,
        componentes_sin_historicos: 8,
        top_componentes: [
          {
            id: 1,
            nombre: 'Motor',
            cantidad_historicos: 25,
          },
        ],
      },
    },
  })
  getStatistics() {
    return this.componentesService.getStatistics();
  }

  @Get('by-modelo/:modeloId')
  @ApiOperation({
    summary: 'Obtener componentes por modelo',
    description:
      'Retorna todos los componentes asociados a un modelo específico',
  })
  @ApiParam({
    name: 'modeloId',
    description: 'ID del modelo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Componentes del modelo obtenidos exitosamente',
    schema: {
      example: [
        {
          id: 1,
          nombre: 'Motor',
          modelo_componentes_historico: [
            {
              id: 1,
              modelo_id: 1,
              componente_id: 1,
              monto_usd: 5000.0,
              pcr: 0.15,
              distribucion: 0.25,
              fecha_efectiva: '2025-09-09T12:00:00.000Z',
            },
          ],
        },
      ],
    },
  })
  findByModelo(@Param('modeloId', ParseIntPipe) modeloId: number) {
    return this.componentesService.findByModelo(modeloId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un componente por ID',
    description:
      'Retorna los detalles de un componente específico con su historial',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del componente',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Componente encontrado',
    schema: {
      example: {
        id: 1,
        nombre: 'Motor',
        modelo_componentes_historico: [
          {
            id: 1,
            modelo_id: 1,
            componente_id: 1,
            monto_usd: 5000.0,
            pcr: 0.15,
            distribucion: 0.25,
            fecha_efectiva: '2025-09-09T12:00:00.000Z',
            modelo: {
              id: 1,
              nombre: 'CAT 320',
              marca: { id: 1, nombre: 'Caterpillar' },
              equipo: { id: 1, nombre: 'Excavadora' },
              flota: { id: 1, nombre: 'Flota A' },
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Componente no encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.componentesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un componente',
    description: 'Actualiza los datos de un componente existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del componente a actualizar',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateComponenteDto })
  @ApiResponse({
    status: 200,
    description: 'Componente actualizado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Motor Diésel',
        modelo_componentes_historico: [],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Componente no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un componente con ese nombre',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateComponenteDto: UpdateComponenteDto,
  ) {
    return this.componentesService.update(id, updateComponenteDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un componente',
    description:
      'Elimina un componente del sistema. No se puede eliminar si tiene registros históricos asociados',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del componente a eliminar',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Componente eliminado exitosamente',
    schema: {
      example: {
        id: 1,
        nombre: 'Motor',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Componente no encontrado',
  })
  @ApiResponse({
    status: 400,
    description:
      'No se puede eliminar el componente porque tiene registros históricos asociados',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.componentesService.remove(id);
  }
}
