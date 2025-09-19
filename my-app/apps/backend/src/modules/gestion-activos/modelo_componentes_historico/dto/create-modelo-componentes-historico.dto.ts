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

export class CreateModeloComponentesHistoricoDto {
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
    description: 'ID del componente asociado',
    example: 1,
    type: Number,
  })
  @IsNumber({}, { message: 'componente_id debe ser un número' })
  @IsInt({ message: 'componente_id debe ser un entero' })
  @IsPositive({ message: 'componente_id debe ser positivo' })
  @Type(() => Number)
  componente_id: number;

  @ApiPropertyOptional({
    description: 'Monto en USD del componente',
    example: 5000.0,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'monto_usd debe ser un número' })
  @Type(() => Number)
  monto_usd?: number;

  @ApiProperty({
    description:
      'PCR (Porcentaje de Costo de Reposición) - Requerido para calcular distribución',
    example: 0.15,
    type: Number,
  })
  @IsNumber({}, { message: 'pcr debe ser un número' })
  @IsPositive({ message: 'pcr debe ser positivo' })
  @Type(() => Number)
  pcr: number;

  @ApiPropertyOptional({
    description:
      'ID de la máquina específica (opcional, para usar su vida_util)',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'machine_id debe ser un número' })
  @IsInt({ message: 'machine_id debe ser un entero' })
  @IsPositive({ message: 'machine_id debe ser positivo' })
  @Type(() => Number)
  machine_id?: number;

  @ApiProperty({
    description: 'Fecha efectiva del registro histórico (ISO string)',
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
