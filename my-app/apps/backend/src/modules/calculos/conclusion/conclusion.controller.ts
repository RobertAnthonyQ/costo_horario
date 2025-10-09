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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConclusionService } from './conclusion.service';
import { CreateAnalisisConclusionDto } from './dto/create-analisis-conclusion.dto';
import type { ConclusionResponse } from './interfaces/conclusion-response.interface';

@ApiTags('Análisis de Conclusión Comparativa')
@ApiBearerAuth('JWT-auth')
@Controller('calculos/conclusion')
export class ConclusionController {
  constructor(private readonly conclusionService: ConclusionService) {}

  @Post('analizar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Genera análisis comparativo de múltiples máquinas',
    description:
      'Analiza múltiples máquinas usando sus análisis de flujo de caja existentes para generar un reporte comparativo con métricas financieras, rankings y recomendaciones.',
  })
  @ApiResponse({
    status: 200,
    description: 'Análisis comparativo generado exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o máquinas no encontradas',
  })
  @ApiResponse({
    status: 404,
    description:
      'Una o más máquinas no encontradas o sin análisis de flujo de caja',
  })
  async analizar(
    @Body() createAnalisisConclusionDto: CreateAnalisisConclusionDto,
  ): Promise<ConclusionResponse> {
    return this.conclusionService.generarAnalisisComparativo(
      createAnalisisConclusionDto,
    );
  }

  @Post('calcular-y-guardar')
  @ApiOperation({
    summary: 'Genera y guarda análisis comparativo',
    description:
      'Genera un análisis comparativo completo y lo guarda en la base de datos para consulta posterior.',
  })
  @ApiResponse({
    status: 201,
    description: 'Análisis generado y guardado exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Error en los datos o al guardar el análisis',
  })
  async calcularYGuardar(
    @Body() createAnalisisConclusionDto: CreateAnalisisConclusionDto,
  ): Promise<any> {
    return this.conclusionService.calcularYGuardar(createAnalisisConclusionDto);
  }

  @Get('todos')
  @ApiOperation({
    summary: 'Obtiene todos los análisis de conclusión',
    description:
      'Lista todos los análisis comparativos realizados, ordenados por fecha descendente. Nota: Funcionalidad pendiente de implementación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista obtenida exitosamente',
  })
  @ApiResponse({
    status: 501,
    description:
      'Funcionalidad no implementada - tabla de base de datos pendiente',
  })
  async getTodos(): Promise<any[]> {
    return this.conclusionService.findTodos();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtiene un análisis comparativo específico por ID',
    description:
      'Obtiene los detalles completos de un análisis comparativo específico. Nota: Funcionalidad pendiente de implementación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Análisis obtenido exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Análisis no encontrado',
  })
  @ApiResponse({
    status: 501,
    description:
      'Funcionalidad no implementada - tabla de base de datos pendiente',
  })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.conclusionService.findById(id);
  }

  @Get('diagnosticar/:versionId')
  @ApiOperation({
    summary: '[TEMPORAL] Diagnostica un análisis de flujo específico',
    description:
      'Endpoint temporal para diagnosticar por qué un análisis de flujo no tiene resultados calculados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Diagnóstico completado',
  })
  async diagnosticar(
    @Param('versionId', ParseIntPipe) versionId: number,
  ): Promise<any> {
    return this.conclusionService.diagnosticarAnalisisFlujo(versionId);
  }

  @Post('guardar')
  @ApiOperation({
    summary: 'Guarda un análisis de conclusión ya calculado',
    description:
      'Guarda los datos de un análisis comparativo completo en la base de datos. Nota: Funcionalidad pendiente de implementación.',
  })
  @ApiResponse({
    status: 201,
    description: 'Análisis guardado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Error al guardar el análisis',
  })
  @ApiResponse({
    status: 501,
    description:
      'Funcionalidad no implementada - tabla de base de datos pendiente',
  })
  async guardar(@Body() data: ConclusionResponse): Promise<any> {
    return this.conclusionService.guardarAnalisis(data);
  }
}
