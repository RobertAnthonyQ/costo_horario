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
} from '@nestjs/swagger';
import { MachinesService } from './machines.service';
import { CreateMachinesDto } from './dto/create-machines.dto';
import { UpdateMachinesDto } from './dto/update-machines.dto';

@ApiTags('machines')
@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva máquina' })
  @ApiBody({ type: CreateMachinesDto })
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
  @ApiOperation({ summary: 'Actualizar una máquina' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateMachinesDto })
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
