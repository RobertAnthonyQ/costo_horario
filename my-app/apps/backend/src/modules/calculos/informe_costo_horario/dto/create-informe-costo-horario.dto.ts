import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

class EscenarioHorasDto {
  @ApiProperty({
    example: 500,
    description: 'Horas mínimas mensuales del escenario',
  })
  @IsNumber()
  horasMinimas: number;

  @ApiProperty({ example: 0.8, description: 'Grado de operatividad (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  gradoOperatividad: number;

  @ApiProperty({
    example: 0.55,
    description: 'Factor de mercado (0-2 normalmente)',
  })
  @IsNumber()
  @Min(0)
  @Max(2)
  factorMercado: number;
}

export class CreateInformeCostoHorarioDto {
  @ApiProperty({ example: 4 })
  @IsNumber()
  machineId: number;

  @ApiProperty({
    example: 1,
    description: 'ID del registro de posesión del cual obtener los escenarios',
  })
  @IsNumber()
  posesionId: number;

  @ApiProperty({ example: 12, default: 12, required: false })
  @IsNumber()
  @IsOptional()
  mesesPorAnio?: number = 12;

  @ApiProperty({
    example: 0.09,
    description: 'Tasa de financiamiento anual (decimal)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  tasaFinanciamiento?: number = 0.09;

  @ApiProperty({
    example: 3,
    description: 'Años de financiamiento',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  aniosFinanciamiento?: number = 3;

  @ApiProperty({
    example: 0.01,
    description: 'Tasa de seguro anual (decimal)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  tasaSeguro?: number = 0.01;

  @ApiProperty({ example: 1, description: 'Años de seguro', required: false })
  @IsNumber()
  @IsOptional()
  aniosSeguro?: number = 1;

  @ApiProperty({
    example: 'Cálculo preliminar informe costo horario',
    required: false,
  })
  @IsString()
  @IsOptional()
  comentario?: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  @IsString()
  @IsOptional()
  usuarioId?: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Si se incluirán gastos distribuibles (placeholder)',
  })
  @IsBoolean()
  @IsOptional()
  incluyeGastosDistribuibles?: boolean = false;

  @ApiProperty({
    example: 0.5,
    description: 'Costo mantenimiento correctivo mayores (USD/hr)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  costoMCorrMayores?: number = 0;

  @ApiProperty({
    example: 8.8,
    description: 'Costo mano de obra técnico (USD/hr)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  mano_de_obra_tecnico?: number = 0;
}
