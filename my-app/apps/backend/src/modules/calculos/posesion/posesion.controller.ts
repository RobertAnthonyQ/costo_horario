import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PosesionService } from './posesion.service';
import { CreateCalculoPosesionDto } from './dto/create-calculo-posesion.dto';
import {
  CalculoPosesionResponse,
  HistorialPosesionResponse,
} from './interfaces/posesion-response.interface';

@ApiTags('Cálculos de Posesión')
@Controller('calculos/posesion')
export class PosesionController {
  constructor(private readonly posesionService: PosesionService) {}

  /**
   * POST /calculos/posesion
   * Calcula y guarda el historial de posesión
   */
  @Post()
  @ApiOperation({
    summary: 'Calcular y guardar posesión',
    description:
      'Realiza el cálculo de posesión para una máquina específica con múltiples escenarios de horas mínimas y guarda el resultado en el historial.',
  })
  @ApiBody({
    description: 'Datos necesarios para el cálculo de posesión',
    type: CreateCalculoPosesionDto,
    examples: {
      ejemplo1: {
        summary: 'Ejemplo básico - 2 escenarios',
        description:
          'Ejemplo de cálculo con 2 escenarios, cada uno con sus propios parámetros',
        value: {
          machine_id: 1,
          horas_json: {
            escenarios: [
              {
                horasMinimas: 450,
                gradoDeOperatividad: 0.8,
                factorDeMercado: 0.55,
              },
              {
                horasMinimas: 500,
                gradoDeOperatividad: 0.75,
                factorDeMercado: 0.6,
              },
            ],
          },
          comentario: 'Cálculo de posesión para análisis de viabilidad',
          usuario_id: 'user-uuid-123',
        },
      },
      ejemplo2: {
        summary: 'Ejemplo con más escenarios',
        description: 'Ejemplo de cálculo con 4 escenarios diferentes',
        value: {
          machine_id: 2,
          horas_json: {
            escenarios: [
              {
                horasMinimas: 200,
                gradoDeOperatividad: 0.9,
                factorDeMercado: 1.1,
              },
              {
                horasMinimas: 250,
                gradoDeOperatividad: 0.85,
                factorDeMercado: 1.0,
              },
              {
                horasMinimas: 300,
                gradoDeOperatividad: 0.8,
                factorDeMercado: 0.95,
              },
              {
                horasMinimas: 350,
                gradoDeOperatividad: 0.75,
                factorDeMercado: 0.9,
              },
            ],
          },
          comentario: 'Evaluación para diferentes condiciones operativas',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cálculo realizado y guardado exitosamente',
    type: HistorialPosesionResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Máquina no encontrada',
    schema: {
      example: {
        message: 'Machine with ID 1 not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
    schema: {
      example: {
        message: [
          'machine_id must be a number',
          'gradoDeOperatividad must be between 0 and 1',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async createAndSave(@Body() createDto: CreateCalculoPosesionDto) {
    return this.posesionService.calculateAndSavePosesion(createDto);
  }

  /**
   * POST /calculos/posesion/preview
   * Solo calcula sin guardar (vista previa)
   */
  @Post('preview')
  @ApiOperation({
    summary: 'Vista previa del cálculo de posesión',
    description:
      'Realiza el cálculo de posesión sin guardar en el historial, útil para análisis y validación antes del guardado final.',
  })
  @ApiBody({
    description: 'Datos necesarios para la vista previa del cálculo',
    type: CreateCalculoPosesionDto,
    examples: {
      preview_ejemplo: {
        summary: 'Vista previa - 2 escenarios',
        description: 'Ejemplo de vista previa con 2 escenarios diferentes',
        value: {
          machine_id: 1,
          horas_json: {
            escenarios: [
              {
                horasMinimas: 400,
                gradoDeOperatividad: 0.85,
                factorDeMercado: 0.95,
              },
              {
                horasMinimas: 480,
                gradoDeOperatividad: 0.8,
                factorDeMercado: 0.9,
              },
            ],
          },
          comentario: 'Vista previa para análisis preliminar',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cálculo realizado exitosamente (sin guardar)',
    type: CalculoPosesionResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Máquina no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  async preview(@Body() createDto: CreateCalculoPosesionDto) {
    return this.posesionService.calculatePosesionPreview(createDto);
  }

  /**
   * GET /calculos/posesion/machine/:machineId/summary
   * Obtiene solo fechas y resumen del historial de posesión (sin JSONs pesados)
   */
  @Get('machine/:machineId/summary')
  @ApiOperation({
    summary: 'Obtener resumen del historial de posesión',
    description:
      'Recupera solo las fechas, comentarios e información básica del historial de una máquina específica, sin los JSONs de resultados. Ideal para mostrar listado de versiones disponibles.',
  })
  @ApiParam({
    name: 'machineId',
    description: 'ID de la máquina',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumen del historial obtenido exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 15 },
          machine_id: { type: 'number', example: 1 },
          fecha_calculo: {
            type: 'string',
            format: 'date-time',
            example: '2025-09-19T10:30:00.000Z',
          },
          comentario: {
            type: 'string',
            example: 'Análisis de viabilidad económica',
            nullable: true,
          },
          usuario_id: {
            type: 'string',
            example: 'user-uuid-123',
            nullable: true,
          },
          numero_escenarios: { type: 'number', example: 3 },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID de máquina inválido',
  })
  async findHistorialSummaryByMachine(
    @Param('machineId', ParseIntPipe) machineId: number,
  ) {
    return this.posesionService.findHistorialSummaryByMachine(machineId);
  }

  /**
   * GET /calculos/posesion/machine/:machineId
   * Obtiene el historial de posesión de una máquina específica
   */
  @Get('machine/:machineId')
  @ApiOperation({
    summary: 'Obtener historial de posesión por máquina',
    description:
      'Recupera todo el historial de cálculos de posesión realizados para una máquina específica, ordenado por fecha descendente.',
  })
  @ApiParam({
    name: 'machineId',
    description: 'ID de la máquina',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial de posesión obtenido exitosamente',
    type: [HistorialPosesionResponse],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID de máquina inválido',
  })
  async findHistorialByMachine(
    @Param('machineId', ParseIntPipe) machineId: number,
  ) {
    return this.posesionService.findHistorialByMachine(machineId);
  }

  /**
   * GET /calculos/posesion/:id
   * Obtiene un registro específico del historial
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener registro específico del historial',
    description:
      'Recupera un registro específico del historial de posesión incluyendo toda la información de la máquina asociada.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del registro de historial',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registro de historial obtenido exitosamente',
    type: HistorialPosesionResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Registro de historial no encontrado',
    schema: {
      example: {
        message: 'Historial with ID 1 not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID de historial inválido',
  })
  async findHistorialById(@Param('id', ParseIntPipe) id: number) {
    return this.posesionService.findHistorialById(id);
  }
}
