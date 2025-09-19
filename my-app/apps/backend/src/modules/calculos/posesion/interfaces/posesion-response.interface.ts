import { ApiProperty } from '@nestjs/swagger';

export class EscenarioCalculosResponse {
  @ApiProperty({
    description: 'Horas mínimas mensuales para este escenario',
    example: 200,
  })
  horasMinimas: number;

  @ApiProperty({
    description: 'Años de vida ideal calculados',
    example: 8.33,
  })
  aniosVidaIdeal: number;

  @ApiProperty({
    description: 'Vida útil del fabricante en horas',
    example: 20000,
  })
  vidaUtilFabricante: number;

  @ApiProperty({
    description: 'Depreciación teórica calculada',
    example: 450000,
  })
  depreciacionTeorica: number;

  @ApiProperty({
    description: 'Grado de operatividad aplicado',
    example: 0.85,
  })
  gradoDeOperatividad: number;

  @ApiProperty({
    description: 'Valor comercial teórico calculado',
    example: 382500,
  })
  valorComercialTeorico: number;

  @ApiProperty({
    description: 'Factor de mercado aplicado',
    example: 0.9,
  })
  factorDeMercado: number;

  @ApiProperty({
    description: 'Valor comercial real calculado',
    example: 344250,
  })
  valorComercialReal: number;

  @ApiProperty({
    description: 'Porcentaje del valor comercial real respecto al valor nuevo',
    example: 68.85,
  })
  porcentajeValorComercialReal: number;

  @ApiProperty({
    description: 'Depreciación real calculada',
    example: 155750,
  })
  depreciacionReal: number;

  @ApiProperty({
    description: 'Depreciación real anual',
    example: 18690,
  })
  depreciacionRealAnual: number;

  @ApiProperty({
    description: 'Depreciación real por hora',
    example: 7.79,
  })
  depreciacionRealHoraria: number;
}

export class MachineInfoResponse {
  @ApiProperty({
    description: 'ID de la máquina',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID interno del equipo',
    example: 'EXC-001',
  })
  id_equipo_interno: string;

  @ApiProperty({
    description: 'Información del modelo de la máquina',
  })
  modelo: any; // Definir un tipo más específico si es necesario
}

export class ResultadosCompletosResponse {
  @ApiProperty({
    description: 'Array con los cálculos para cada escenario de horas',
    type: [EscenarioCalculosResponse],
  })
  escenarios: EscenarioCalculosResponse[];

  @ApiProperty({
    description: 'ID de la máquina calculada',
    example: 1,
  })
  machine_id: number;

  @ApiProperty({
    description: 'Fecha y hora del cálculo',
    example: '2025-09-14T10:30:00.000Z',
  })
  fecha_calculo: string;

  @ApiProperty({
    description: 'Parámetros de entrada utilizados en el cálculo',
  })
  inputs: any;
}

export class CalculoPosesionResponse {
  @ApiProperty({
    description: 'Información de la máquina',
    type: MachineInfoResponse,
  })
  machine_info: MachineInfoResponse;

  @ApiProperty({
    description: 'Resultados completos del cálculo',
    type: ResultadosCompletosResponse,
  })
  resultados: ResultadosCompletosResponse;
}

export class HistorialPosesionResponse {
  @ApiProperty({
    description: 'ID del registro de historial',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID de la máquina',
    example: 1,
  })
  machine_id: number;

  @ApiProperty({
    description: 'ID del usuario que realizó el cálculo',
    example: 'user-uuid-123',
    required: false,
  })
  usuario_id?: string;

  @ApiProperty({
    description: 'Resultados del cálculo almacenados en formato JSON',
  })
  resultados_json: any;

  @ApiProperty({
    description: 'Horas utilizadas en el cálculo en formato JSON',
  })
  horas_json: any;

  @ApiProperty({
    description: 'Comentario del cálculo',
    example: 'Análisis de viabilidad económica',
    required: false,
  })
  comentario?: string;

  @ApiProperty({
    description: 'Fecha y hora del cálculo',
    example: '2025-09-14T10:30:00.000Z',
  })
  fecha_calculo: string;

  @ApiProperty({
    description: 'Información de la máquina (solo en consultas detalladas)',
    type: MachineInfoResponse,
    required: false,
  })
  machine_info?: MachineInfoResponse;
}
