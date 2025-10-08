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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ModeloComponentesHistoricoService } from './modelo-componentes-historico.service';
import { CreateModeloComponentesHistoricoDto } from './dto/create-modelo-componentes-historico.dto';
import { UpdateModeloComponentesHistoricoDto } from './dto/update-modelo-componentes-historico.dto';

@ApiTags('Modelo Componentes Histórico')
@Controller('modelo-componentes-historico')
export class ModeloComponentesHistoricoController {
  constructor(
    private readonly modeloComponentesHistoricoService: ModeloComponentesHistoricoService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo registro histórico de componente por modelo',
    description:
      'Crea un nuevo registro histórico de componente asociado a un modelo específico',
  })
  @ApiBody({ type: CreateModeloComponentesHistoricoDto })
  @ApiResponse({
    status: 201,
    description: 'Registro histórico de componente creado exitosamente',
    schema: {
      example: {
        id: 1,
        modelo_id: 1,
        componente_id: 1,
        monto_usd: 5000.0,
        pcr: 0.15,
        distribucion: 0.25,
        monto_aplicado_al_proyecto: 1250.0,
        fecha_efectiva: '2025-09-15T12:00:00.000Z',
        modelo: {
          id: 1,
          nombre: 'CAT 320D',
          marca: {
            id: 1,
            nombre: 'Caterpillar',
          },
          equipo: {
            id: 1,
            nombre: 'Excavadora',
          },
          flota: {
            id: 1,
            nombre: 'Flota A',
          },
        },
        componente: {
          id: 1,
          nombre: 'Motor',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o referencias no encontradas',
  })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body()
    createModeloComponentesHistoricoDto: CreateModeloComponentesHistoricoDto,
  ) {
    return this.modeloComponentesHistoricoService.create(
      createModeloComponentesHistoricoDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los registros históricos de componentes',
    description:
      'Retorna la lista completa de registros históricos de componentes con sus relaciones ordenados por fecha descendente',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros históricos obtenida exitosamente',
    schema: {
      example: [
        {
          id: 1,
          modelo_id: 1,
          componente_id: 1,
          monto_usd: 5000.0,
          pcr: 0.15,
          distribucion: 0.25,
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          modelo: {
            id: 1,
            nombre: 'CAT 320D',
            marca: { id: 1, nombre: 'Caterpillar' },
            equipo: { id: 1, nombre: 'Excavadora' },
            flota: { id: 1, nombre: 'Flota A' },
          },
          componente: {
            id: 1,
            nombre: 'Motor',
          },
        },
      ],
    },
  })
  findAll() {
    return this.modeloComponentesHistoricoService.findAll();
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Obtener estadísticas de registros históricos de componentes',
    description:
      'Retorna estadísticas generales sobre los registros históricos de componentes del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        total_registros: 150,
        top_componentes: [
          {
            componente_id: 1,
            nombre: 'Motor',
            cantidad_registros: 45,
            monto_usd_promedio: 5500.0,
            pcr_promedio: 0.15,
            distribucion_promedio: 0.25,
          },
        ],
        top_modelos: [
          {
            modelo_id: 1,
            nombre: 'CAT 320D',
            marca: 'Caterpillar',
            cantidad_registros: 25,
          },
        ],
      },
    },
  })
  getStatistics() {
    return this.modeloComponentesHistoricoService.getStatistics();
  }

  @Get('by-modelo/:modeloId')
  @ApiOperation({
    summary: 'Obtener registros históricos de componentes por modelo',
    description:
      'Retorna todos los registros históricos de componentes de un modelo específico',
  })
  @ApiParam({
    name: 'modeloId',
    description: 'ID del modelo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Registros históricos del modelo obtenidos exitosamente',
  })
  findByModelo(@Param('modeloId', ParseIntPipe) modeloId: number) {
    return this.modeloComponentesHistoricoService.findByModelo(modeloId);
  }

  @Get('by-componente/:componenteId')
  @ApiOperation({
    summary: 'Obtener registros históricos por componente',
    description:
      'Retorna todos los registros históricos de un componente específico',
  })
  @ApiParam({
    name: 'componenteId',
    description: 'ID del componente',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Registros históricos del componente obtenidos exitosamente',
  })
  findByComponente(@Param('componenteId', ParseIntPipe) componenteId: number) {
    return this.modeloComponentesHistoricoService.findByComponente(
      componenteId,
    );
  }

  @Get('by-fecha-range')
  @ApiOperation({
    summary: 'Obtener registros históricos por rango de fechas',
    description:
      'Retorna todos los registros históricos en un rango de fechas específico',
  })
  @ApiQuery({
    name: 'fechaDesde',
    description: 'Fecha desde (ISO string)',
    type: String,
    example: '2025-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'fechaHasta',
    description: 'Fecha hasta (ISO string)',
    type: String,
    example: '2025-12-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description:
      'Registros históricos en el rango de fechas obtenidos exitosamente',
  })
  findByFechaRange(
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.modeloComponentesHistoricoService.findByFechaRange(
      fechaDesde,
      fechaHasta,
    );
  }

  @Get('latest-by-modelo/:modeloId')
  @ApiOperation({
    summary: 'Obtener registros más recientes por modelo',
    description:
      'Retorna el registro más reciente de cada componente para un modelo específico',
  })
  @ApiParam({
    name: 'modeloId',
    description: 'ID del modelo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Registros más recientes del modelo obtenidos exitosamente',
    schema: {
      example: [
        {
          id: 5,
          modelo_id: 1,
          componente_id: 1,
          monto_usd: 5200.0,
          pcr: 0.18,
          distribucion: 0.28,
          fecha_efectiva: '2025-09-15T12:00:00.000Z',
          modelo: {
            id: 1,
            nombre: 'CAT 320D',
            marca: { id: 1, nombre: 'Caterpillar' },
          },
          componente: {
            id: 1,
            nombre: 'Motor',
          },
        },
      ],
    },
  })
  getLatestByModelo(@Param('modeloId', ParseIntPipe) modeloId: number) {
    return this.modeloComponentesHistoricoService.getLatestByModelo(modeloId);
  }

  @Get('total-resumen-by-modelo/:modeloId')
  @ApiOperation({
    summary: 'Obtener resumen total de costos aplicados por modelo',
    description:
      'Retorna un resumen completo de costos con suma total de montos aplicados y porcentajes respecto al valor de adquisición',
  })
  @ApiParam({
    name: 'modeloId',
    description: 'ID del modelo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen total de costos obtenido exitosamente',
    schema: {
      example: {
        modelo: {
          id: 1,
          nombre: 'CAT 320D',
          marca: 'Caterpillar',
          equipo: 'Excavadora',
          flota: 'Flota A',
          vida_util_fabricante: 10000,
        },
        resumen_total: {
          valor_adquisicion: 1500000,
          total_monto_aplicado: 125000,
          porcentaje_respecto_valor_adquisicion: 8.33,
          cantidad_componentes: 7,
        },
        componentes_detalle: [
          {
            componente_id: 1,
            componente_nombre: 'Motor',
            monto_aplicado_al_proyecto: 45000,
            porcentaje_respecto_total: 36.0,
            porcentaje_respecto_valor_adquisicion: 3.0,
          },
        ],
      },
    },
  })
  getTotalResumenByModelo(@Param('modeloId', ParseIntPipe) modeloId: number) {
    return this.modeloComponentesHistoricoService.getTotalResumenByModelo(
      modeloId,
    );
  }

  @Get('resumen-por-componente')
  @ApiOperation({
    summary: 'Obtener resumen de costos agrupados por componente',
    description:
      'Retorna estadísticas y análisis comparativo de costos por componente, opcionalmente filtrado por modelo',
  })
  @ApiQuery({
    name: 'modeloId',
    description: 'ID del modelo para filtrar (opcional)',
    type: Number,
    required: false,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen por componente obtenido exitosamente',
    schema: {
      example: {
        resumen_general: {
          total_componentes: 7,
          total_registros: 25,
          total_general_monto_aplicado: 125000,
        },
        componentes: [
          {
            componente_id: 1,
            componente_nombre: 'Motor',
            estadisticas: {
              total_monto_aplicado: 45000,
              promedio_monto_aplicado: 15000,
            },
            porcentaje_respecto_total_general: 36.0,
          },
        ],
      },
    },
  })
  getResumenPorComponente(@Query('modeloId', ParseIntPipe) modeloId?: number) {
    return this.modeloComponentesHistoricoService.getResumenPorComponente(
      modeloId,
    );
  }

  @Get('machines-by-modelo/:modeloId')
  @ApiOperation({
    summary: 'Obtener máquinas de un modelo para selección',
    description:
      'Retorna las máquinas disponibles de un modelo específico con su vida_util para poder calcular distribución',
  })
  @ApiParam({
    name: 'modeloId',
    description: 'ID del modelo',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Máquinas del modelo obtenidas exitosamente',
    schema: {
      example: [
        {
          id: 1,
          id_equipo_interno: 'EQ-001',
          estado: 'activo',
          vida_util: 10000,
          horometro_inicial: 0,
        },
      ],
    },
  })
  getMachinesByModelo(@Param('modeloId', ParseIntPipe) modeloId: number) {
    return this.modeloComponentesHistoricoService.getMachinesByModelo(modeloId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un registro histórico de componente por ID',
    description:
      'Retorna los detalles completos de un registro histórico específico con todas sus relaciones',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del registro histórico',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Registro histórico encontrado',
    schema: {
      example: {
        id: 1,
        modelo_id: 1,
        componente_id: 1,
        monto_usd: 5000.0,
        pcr: 0.15,
        distribucion: 0.25,
        fecha_efectiva: '2025-09-15T12:00:00.000Z',
        modelo: {
          id: 1,
          nombre: 'CAT 320D',
          marca: { id: 1, nombre: 'Caterpillar' },
          equipo: { id: 1, nombre: 'Excavadora' },
          flota: { id: 1, nombre: 'Flota A' },
          machines: [
            {
              id: 1,
              estado: 'activo',
              id_equipo_interno: 'EQ-001',
            },
          ],
        },
        componente: {
          id: 1,
          nombre: 'Motor',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Registro histórico no encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modeloComponentesHistoricoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un registro histórico de componente',
    description:
      'Actualiza los datos de un registro histórico de componente existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del registro histórico a actualizar',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateModeloComponentesHistoricoDto })
  @ApiResponse({
    status: 200,
    description: 'Registro histórico actualizado exitosamente',
    schema: {
      example: {
        id: 1,
        modelo_id: 1,
        componente_id: 1,
        monto_usd: 5500.0,
        pcr: 0.18,
        distribucion: 0.28,
        fecha_efectiva: '2025-09-15T12:00:00.000Z',
        modelo: {
          id: 1,
          nombre: 'CAT 320D',
          marca: { id: 1, nombre: 'Caterpillar' },
        },
        componente: {
          id: 1,
          nombre: 'Motor',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Registro histórico no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o referencias no encontradas',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateModeloComponentesHistoricoDto: UpdateModeloComponentesHistoricoDto,
  ) {
    return this.modeloComponentesHistoricoService.update(
      id,
      updateModeloComponentesHistoricoDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un registro histórico de componente',
    description: 'Elimina un registro histórico de componente del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del registro histórico a eliminar',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Registro histórico eliminado exitosamente',
    schema: {
      example: {
        id: 1,
        modelo_id: 1,
        componente_id: 1,
        monto_usd: 5000.0,
        pcr: 0.15,
        distribucion: 0.25,
        fecha_efectiva: '2025-09-15T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Registro histórico no encontrado',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modeloComponentesHistoricoService.remove(id);
  }
}
