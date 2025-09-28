import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CreateInformeCostoHorarioDto } from './dto/create-informe-costo-horario.dto';
import { InformeCostoHorarioService } from './informe-costo-horario.service';

@ApiTags('Informe Costo Horario')
@Controller('calculos/informe-costo-horario')
export class InformeCostoHorarioController {
  constructor(private service: InformeCostoHorarioService) {}

  @Post()
  @ApiOperation({
    summary: 'Calcular y guardar informe de costo horario',
    description:
      'Realiza el cálculo del informe de costo horario obteniendo los escenarios desde un registro de posesión y guarda el resultado en el historial.',
  })
  @ApiBody({
    description: 'Datos necesarios para generar y guardar el informe',
    type: CreateInformeCostoHorarioDto,
    examples: {
      ejemplo1: {
        summary: 'Ejemplo básico',
        description:
          'Ejemplo para calcular y guardar usando escenarios desde posesión',
        value: {
          machineId: 4,
          posesionId: 1,
          mesesPorAnio: 12,
          tasaFinanciamiento: 0.09,
          aniosFinanciamiento: 3,
          tasaSeguro: 0.01,
          aniosSeguro: 1,
          comentario: 'Cálculo preliminar informe costo horario',
          usuarioId: 'user-uuid',
          incluyeGastosDistribuibles: false,
          costoMCorrMayores: 0.9,
          mano_de_obra_tecnico: 8.8,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Informe calculado y guardado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Máquina o registro de posesión no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  async createAndSave(@Body() dto: CreateInformeCostoHorarioDto) {
    return this.service.calculateAndSave(dto);
  }

  @Post('preview')
  @ApiOperation({
    summary: 'Vista previa del informe de costo horario',
    description:
      'Genera una vista previa del informe de costo horario obteniendo los escenarios desde un registro de posesión existente.',
  })
  @ApiBody({
    description:
      'Datos necesarios para generar el informe, los escenarios se obtienen del registro de posesión especificado',
    type: CreateInformeCostoHorarioDto,
    examples: {
      ejemplo1: {
        summary: 'Ejemplo básico',
        description: 'Ejemplo usando escenarios desde posesión',
        value: {
          machineId: 4,
          posesionId: 1,
          mesesPorAnio: 12,
          tasaFinanciamiento: 0.09,
          aniosFinanciamiento: 3,
          tasaSeguro: 0.01,
          aniosSeguro: 1,
          comentario: 'Cálculo preliminar informe costo horario',
          usuarioId: 'user-uuid',
          incluyeGastosDistribuibles: false,
          costoMCorrMayores: 0.9,
          mano_de_obra_tecnico: 8.8,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vista previa generada exitosamente (sin guardar)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Máquina o registro de posesión no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  async preview(@Body() dto: CreateInformeCostoHorarioDto) {
    return this.service.preview(dto);
  }

  @Get('machine/:machineId')
  @ApiOperation({
    summary: 'Obtener historial de informes por máquina',
    description:
      'Recupera todo el historial de informes de costo horario realizados para una máquina específica, ordenado por fecha descendente.',
  })
  @ApiParam({
    name: 'machineId',
    description: 'ID de la máquina',
    type: 'integer',
    example: 4,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial de informes obtenido exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID de máquina inválido',
  })
  async findHistorialByMachine(
    @Param('machineId', ParseIntPipe) machineId: number,
  ) {
    return this.service.findHistorialByMachine(machineId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener informe específico del historial',
    description:
      'Recupera un informe específico del historial incluyendo toda la información de la máquina asociada.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del registro de historial del informe',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Informe de historial obtenido exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Informe de historial no encontrado',
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
    return this.service.findHistorialById(id);
  }

  @Get('resumen/:historialId')
  @ApiOperation({
    summary: 'Obtener resumen de costo horario desde historial',
    description:
      'Genera un resumen simplificado del costo horario basado en un registro de historial existente.',
  })
  @ApiParam({
    name: 'historialId',
    description: 'ID del registro de historial del informe',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumen de costo horario obtenido exitosamente',
    schema: {
      example: {
        machine: {
          id: 4,
          item: 4,
          equipo: 'Rockdrill',
          marca: 'EPIROC',
          modelo: 'SMARTROC',
          estado: 'Capex_Nuevo',
          idEquipo: 'Rockdrill EPIROC SmartRoc',
        },
        parametros: {
          posesionId: 1,
          tasaFinanciamiento: 0.09,
          aniosFinanciamiento: 3,
          tasaSeguro: 0.01,
          porcentajeUtilidad: 0.1,
          fechaCalculo: '2025-09-16T10:30:00.000Z',
        },
        resumen: [
          {
            'V.Adq ($)': 1150000,
            Hmin: 500,
            D: 37.43,
            F: 9.36,
            S: 109.05,
            Mp: 10.0,
            Mc: 15.5,
            Est: 3.0,
            Neu: 2.5,
            Gets: 4.2,
            Posesión: 155.84,
            RyM: 35.2,
            MOTec: 8.8,
            Costo_Hr: 199.84,
            U: '10%',
            Tarifa: 219.82,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Registro de historial no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID de historial inválido',
  })
  async getResumenFromHistorial(
    @Param('historialId', ParseIntPipe) historialId: number,
  ) {
    return this.service.getResumenFromHistorial(historialId);
  }

  @Get('resumen/:posesionId/:machineId')
  @ApiOperation({
    summary: 'Obtener resumen de costo horario (endpoint compatibilidad)',
    description:
      'Genera un resumen simplificado del costo horario. Busca el historial más reciente para la máquina especificada.',
  })
  @ApiParam({
    name: 'posesionId',
    description: 'ID del registro de posesión (para compatibilidad)',
    type: 'integer',
    example: 1,
  })
  @ApiParam({
    name: 'machineId',
    description: 'ID de la máquina',
    type: 'integer',
    example: 4,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumen de costo horario obtenido exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Máquina o historial no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'IDs inválidos',
  })
  async getResumenCostoHorarioCompatibilidad(
    @Param('posesionId', ParseIntPipe) posesionId: number,
    @Param('machineId', ParseIntPipe) machineId: number,
  ) {
    return this.service.getResumenCostoHorarioCompatibilidad(
      posesionId,
      machineId,
    );
  }

  @Get('machines/latest-reports')
  @ApiOperation({
    summary: 'Obtener todas las máquinas con sus últimos reportes',
    description:
      'Recupera todas las máquinas que tienen reportes de costo horario junto con información del reporte más reciente de cada una.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Lista de máquinas con sus últimos reportes obtenida exitosamente',
    schema: {
      example: [
        {
          machine: {
            id: 4,
            item: 4,
            equipo: 'Rockdrill',
            marca: 'EPIROC',
            modelo: 'SMARTROC',
            horometroInicial: 0,
            estado: 'Capex_Nuevo',
            idEquipo: 'Rockdrill EPIROC SmartRoc',
            valorSimilarNuevo: 1150000,
            politicaDepreciacion: 10,
            vidaUtil: 20000,
          },
          latestReport: {
            id: 15,
            fechaCalculo: '2025-09-16T10:30:00.000Z',
            tasaFinanciamiento: 0.09,
            aniosFinanciamiento: 3,
            tasaSeguro: 0.01,
            aniosSeguro: 1,
            mesPorAnio: 12,
            usuarioId: 'user-uuid',
          },
          hasReports: true,
          totalReports: 1,
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error interno del servidor',
  })
  async getAllMachinesWithLatestReports() {
    return this.service.getAllMachinesWithLatestReports();
  }

  @Get('machines/resumen-reports')
  @ApiOperation({
    summary: 'Obtener todas las máquinas con resumen de sus últimos reportes',
    description:
      'Recupera todas las máquinas que tienen reportes de costo horario junto con el resumen completo del reporte más reciente de cada una.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Lista de máquinas con resumen de sus últimos reportes obtenida exitosamente',
    schema: {
      example: [
        {
          machine: {
            id: 4,
            item: 4,
            equipo: 'Rockdrill',
            marca: 'EPIROC',
            modelo: 'SMARTROC',
            estado: 'Capex_Nuevo',
            idEquipo: 'Rockdrill EPIROC SmartRoc',
            valorSimilarNuevo: 1150000,
          },
          latestReport: {
            id: 15,
            fechaCalculo: '2025-09-16T10:30:00.000Z',
            tasaFinanciamiento: 0.09,
            aniosFinanciamiento: 3,
          },
          resumen: [
            {
              'V.Adq ($)': 1150000,
              Hmin: 500,
              D: 37.43,
              F: 9.36,
              S: 109.05,
              Mp: 10.0,
              Mc: 15.5,
              Posesión: 155.84,
              RyM: 35.2,
              Costo_Hr: 199.84,
              Tarifa: 219.82,
            },
          ],
          parametros: {
            machineId: 4,
            posesionId: 1,
            tasaFinanciamiento: 0.09,
            porcentajeUtilidad: 0.1,
            fechaCalculo: '2025-09-16T10:30:00.000Z',
          },
          hasReports: true,
          totalReports: 1,
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error interno del servidor',
  })
  async getAllMachinesResumenReports() {
    return this.service.getAllMachinesResumenReports();
  }
}
