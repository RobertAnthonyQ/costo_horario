import {
  IsNumber,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatiosHistoricoDto {
  @ApiProperty({
    description: 'ID del modelo asociado',
    example: 1,
    type: Number,
  })
  @IsNumber({}, { message: 'modelo_id debe ser un número' })
  @IsInt({ message: 'modelo_id debe ser un entero' })
  @IsPositive({ message: 'modelo_id debe ser positivo' })
  @Type(() => Number)
  modelo_id: number;

  @ApiProperty({
    description: 'ID del tipo de ratio asociado',
    example: 1,
    type: Number,
  })
  @IsNumber({}, { message: 'tipo_ratio_id debe ser un número' })
  @IsInt({ message: 'tipo_ratio_id debe ser un entero' })
  @IsPositive({ message: 'tipo_ratio_id debe ser positivo' })
  @Type(() => Number)
  tipo_ratio_id: number;

  @ApiPropertyOptional({
    description: 'Valor del ratio (puede ser null)',
    example: 0.85,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'valor debe ser un número' })
  @Type(() => Number)
  valor?: number;

  @ApiProperty({
    description: 'Fecha efectiva del ratio (ISO string)',
    example: '2025-09-15T12:00:00.000Z',
    type: String,
  })
  @IsDateString({}, { message: 'fecha_efectiva debe ser una fecha válida' })
  @IsNotEmpty({ message: 'fecha_efectiva es requerida' })
  @Transform(({ value }) => {
    // Si viene como string, lo mantenemos así para que sea parseado correctamente
    if (typeof value === 'string') return value;
    // Si viene como Date, lo convertimos a ISO string
    if (value instanceof Date) return value.toISOString();
    return value;
  })
  fecha_efectiva: string;
}
