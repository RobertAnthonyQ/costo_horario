import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FlujoCajaService } from './flujo-caja.service';
import { CreateAnalisisFlujoDto } from './dto/create-analisis-flujo.dto';
import { ExtractEscenariosDto } from './dto/extract-escenarios.dto';
import type { FlujoCajaResponse } from './interfaces/flujo-caja-response.interface';

@ApiTags('Análisis de Flujo de Caja')
@Controller('calculos/flujo-caja')
export class FlujoCajaController {
  constructor(private readonly flujoCajaService: FlujoCajaService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview - Precarga datos y hace cálculo automáticamente',
    description:
      'Obtiene datos del último informe de costo horario y realiza el cálculo de flujo de caja automáticamente. Incluye todos los datos precargados listos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cálculo realizado exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Máquina no encontrada o sin informe de costo horario previo',
  })
  async preview(
    @Body() createAnalisisFlujoDto: CreateAnalisisFlujoDto,
  ): Promise<any> {
    return this.flujoCajaService.preview(createAnalisisFlujoDto);
  }

  @Post('extraer-escenarios')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Extrae solo los escenarios de horas',
    description:
      'Obtiene únicamente los escenarios de horas del último informe de costo horario de una máquina',
  })
  @ApiResponse({
    status: 200,
    description: 'Escenarios extraídos exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Máquina no encontrada o sin informe de costo horario previo',
  })
  async extraerEscenarios(
    @Body() extractEscenariosDto: ExtractEscenariosDto,
  ): Promise<any> {
    return this.flujoCajaService.extraerEscenarios(
      extractEscenariosDto.machineId,
    );
  }

  @Post('guardar')
  @ApiOperation({
    summary: 'Guarda análisis de flujo de caja',
    description:
      'Guarda un análisis de flujo de caja completo en la base de datos',
  })
  @ApiResponse({
    status: 201,
    description: 'Análisis guardado exitosamente',
  })
  async guardar(
    @Body() createAnalisisFlujoDto: CreateAnalisisFlujoDto,
  ): Promise<any> {
    return this.flujoCajaService.calcularYGuardar(createAnalisisFlujoDto);
  }

  @Get('todos')
  @ApiOperation({
    summary: 'Obtiene todos los análisis de flujo de caja',
    description:
      'Lista todos los análisis realizados, ordenados por fecha descendente',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista obtenida exitosamente',
  })
  async getTodos(): Promise<any[]> {
    return this.flujoCajaService.findTodos();
  }

  @Get('versiones')
  @ApiOperation({
    summary: 'Obtiene versiones (solo nombres y fechas)',
    description:
      'Lista solo los nombres y fechas de los análisis para selección rápida',
  })
  @ApiResponse({
    status: 200,
    description: 'Versiones obtenidas exitosamente',
  })
  async getVersiones(): Promise<any[]> {
    return this.flujoCajaService.findVersiones();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtiene un análisis específico por ID',
    description:
      'Obtiene los detalles completos de un análisis de flujo de caja específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Análisis obtenido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Análisis no encontrado',
  })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.flujoCajaService.findById(id);
  }
}
