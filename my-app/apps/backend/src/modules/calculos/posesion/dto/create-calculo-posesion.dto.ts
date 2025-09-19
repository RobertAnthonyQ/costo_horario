import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class EscenarioDto {
  @ApiProperty({
    description: 'Horas mínimas mensuales para este escenario',
    example: 450,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  horasMinimas: number;

  @ApiProperty({
    description:
      'Grado de operatividad de la máquina (0 a 1), donde 1 es operatividad perfecta',
    example: 0.85,
    type: Number,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'El grado de operatividad debe ser mayor o igual a 0' })
  @Max(1, { message: 'El grado de operatividad debe ser menor o igual a 1' })
  gradoDeOperatividad: number;

  @ApiProperty({
    description:
      'Factor de mercado para ajustar el valor comercial (0 a 2), normalmente entre 0.8 y 1.2',
    example: 0.9,
    type: Number,
    minimum: 0,
    maximum: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'El factor de mercado debe ser mayor a 0' })
  @Max(2, { message: 'El factor de mercado debe ser menor o igual a 2' })
  factorDeMercado: number;
}

class HorasDto {
  @ApiProperty({
    description:
      'Array de escenarios con horas mínimas y sus respectivos parámetros',
    example: [
      { horasMinimas: 450, gradoDeOperatividad: 0.8, factorDeMercado: 0.55 },
      { horasMinimas: 500, gradoDeOperatividad: 0.75, factorDeMercado: 0.6 },
    ],
    type: [EscenarioDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EscenarioDto)
  escenarios: EscenarioDto[];
}

export class CreateCalculoPosesionDto {
  @ApiProperty({
    description:
      'ID de la máquina para la cual se realizará el cálculo de posesión',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  machine_id: number;

  @ApiProperty({
    description:
      'Objeto que contiene los escenarios con horas mínimas y sus parámetros específicos',
    example: {
      escenarios: [
        { horasMinimas: 450, gradoDeOperatividad: 0.8, factorDeMercado: 0.55 },
        { horasMinimas: 500, gradoDeOperatividad: 0.75, factorDeMercado: 0.6 },
      ],
    },
    type: HorasDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => HorasDto)
  horas_json: HorasDto;

  @ApiProperty({
    description: 'Comentario opcional sobre el cálculo',
    example: 'Cálculo de posesión para análisis de viabilidad',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  comentario?: string;

  @ApiProperty({
    description: 'ID del usuario que realiza el cálculo (opcional)',
    example: 'user-uuid-123',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  usuario_id?: string;
}
