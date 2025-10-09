import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FlujoCajaService } from './flujo-caja.service';
import { CreateAnalisisFlujoDto } from './dto/create-analisis-flujo.dto';
import { ExtractEscenariosDto } from './dto/extract-escenarios.dto';
import { AmortizacionParametrosDto } from './dto/amortizacion-parametros.dto';
import type { FlujoCajaResponse } from './interfaces/flujo-caja-response.interface';

@ApiTags('Análisis de Flujo de Caja')
@ApiBearerAuth('JWT-auth')
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
      'Lista solo los nombres y fechas de los análisis para selección rápida. Si se proporciona machineId, filtra por máquina específica.',
  })
  @ApiResponse({
    status: 200,
    description: 'Versiones obtenidas exitosamente',
  })
  async getVersiones(
    @Query('machineId', new ParseIntPipe({ optional: true }))
    machineId?: number,
  ): Promise<any[]> {
    return this.flujoCajaService.findVersiones(machineId);
  }

  @Post('amortizacion/parametros')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener parámetros de amortización para crear tabla',
    description:
      'Devuelve parámetros clave del último informe de costo horario para que el frontend construya la tabla de amortización. Incluye capital, tasa, TEA, años, cuota mensual y fórmulas Excel.',
  })
  @ApiResponse({
    status: 200,
    description: 'Parámetros obtenidos exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Máquina no encontrada o sin informe de costo horario previo',
  })
  async obtenerParametrosAmortizacion(
    @Body() dto: AmortizacionParametrosDto,
  ): Promise<any> {
    return this.flujoCajaService.obtenerParametrosAmortizacion(dto.machineId);
  }

  @Get('amortizacion/reporte/:id')
  @ApiOperation({
    summary: 'Obtener parámetros de amortización de un reporte guardado',
    description:
      'Devuelve los parámetros exactos que se usaron en un análisis de flujo específico. Útil para reproducir exactamente la tabla de amortización de un reporte pasado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Parámetros del reporte obtenidos exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Análisis de flujo no encontrado',
  })
  async obtenerParametrosAmortizacionReporte(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    return this.flujoCajaService.obtenerParametrosAmortizacionReporte(id);
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
