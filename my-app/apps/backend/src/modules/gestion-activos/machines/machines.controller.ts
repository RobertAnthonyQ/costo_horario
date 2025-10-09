import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MachinesService } from './machines.service';
import { CreateMachinesDto } from './dto/create-machines.dto';
import { UpdateMachinesDto } from './dto/update-machines.dto';

@ApiTags('machines')
@ApiBearerAuth('JWT-auth')
@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva máquina',
    description:
      'Crea una nueva máquina. Puede incluir datos adicionales en otros_json como procedencia, potencia, consumo, etc.',
  })
  @ApiBody({
    type: CreateMachinesDto,
    examples: {
      maquina_completa: {
        summary: 'Máquina con datos adicionales completos',
        description: 'Ejemplo de máquina con todos los datos adicionales',
        value: {
          modelo_id: 1,
          estado: 'activo',
          valor_similar_nuevo: 250000,
          vida_util: 18000,
          otros_json: {
            procedencia_pais: 'Estados Unidos',
            potencia_nominal_hp: '231 HP @ 2,000',
            consumo_combustible_lh: 15.5,
            equipos_comercializados_peru: 150,
            plazo_entrega_dias: 45,
            capacitacion_horas: 40,
            tiempo_atencion_repuestos_dias: 7,
            ofrece_financiamiento: true,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Máquina creada correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createMachinesDto: CreateMachinesDto) {
    return this.machinesService.create(createMachinesDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las máquinas' })
  @ApiResponse({ status: 200, description: 'Listado obtenido' })
  findAll() {
    return this.machinesService.findAll();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtener estadísticas de máquinas' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  getStatistics() {
    return this.machinesService.getStatistics();
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar máquinas con filtros' })
  @ApiQuery({ name: 'modelo_id', required: false, type: Number })
  @ApiQuery({ name: 'estado', required: false, type: String })
  @ApiQuery({ name: 'marca_id', required: false, type: Number })
  @ApiQuery({ name: 'valor_min', required: false, type: Number })
  @ApiQuery({ name: 'valor_max', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Resultados obtenidos' })
  findWithFilters(
    @Query('modelo_id') modeloId?: string,
    @Query('estado') estado?: string,
    @Query('marca_id') marcaId?: string,
    @Query('valor_min') valorMin?: string,
    @Query('valor_max') valorMax?: string,
  ) {
    const filters = {
      modelo_id: modeloId ? parseInt(modeloId) : undefined,
      estado: estado || undefined,
      marca_id: marcaId ? parseInt(marcaId) : undefined,
      valor_min: valorMin ? parseFloat(valorMin) : undefined,
      valor_max: valorMax ? parseFloat(valorMax) : undefined,
    };

    return this.machinesService.findWithFilters(filters);
  }

  @Get('by-modelo/:modeloId')
  @ApiOperation({ summary: 'Listar máquinas por modelo' })
  @ApiParam({ name: 'modeloId', type: Number })
  @ApiResponse({ status: 200, description: 'Listado obtenido' })
  findByModelo(@Param('modeloId', ParseIntPipe) modeloId: number) {
    return this.machinesService.findByModelo(modeloId);
  }

  @Get('by-estado')
  @ApiOperation({ summary: 'Listar máquinas por estado' })
  @ApiQuery({ name: 'estado', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Listado obtenido' })
  @ApiResponse({ status: 400, description: 'Parámetro faltante' })
  findByEstado(@Query('estado') estado: string) {
    if (!estado) {
      throw new BadRequestException('El parámetro estado es requerido');
    }
    return this.machinesService.findByEstado(estado);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una máquina por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Máquina obtenida' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.machinesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una máquina',
    description:
      'Actualiza los datos de una máquina existente. Puede actualizar datos adicionales en otros_json.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    type: UpdateMachinesDto,
    examples: {
      actualizar_datos_adicionales: {
        summary: 'Actualizar solo datos adicionales',
        description: 'Ejemplo de actualización de datos adicionales',
        value: {
          otros_json: {
            procedencia_pais: 'Japón',
            potencia_nominal_hp: 180,
            consumo_combustible_lh: 14.2,
            tiempo_atencion_repuestos_dias: 5,
            ofrece_financiamiento: false,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Máquina actualizada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMachinesDto: UpdateMachinesDto,
  ) {
    return this.machinesService.update(id, updateMachinesDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una máquina' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Eliminada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.machinesService.remove(id);
  }
}
