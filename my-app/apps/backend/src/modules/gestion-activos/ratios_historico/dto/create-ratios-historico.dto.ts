import {
  IsNumber,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsOptional,
  IsDateString,
  IsString,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { RatiosVersion } from '../interfaces/ratios-version.interface';

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

  @ApiPropertyOptional({
    description:
      'OPCIONAL: Versión completa de ratios en formato JSON. Solo se guarda si lo envías explícitamente. NO se genera automáticamente.',
    example: {
      fecha_efectiva: '2025-09-15T12:00:00.000Z',
      ratios: [
        {
          tipo_ratio_id: 1,
          tipo_ratio_nombre: 'Disponibilidad',
          valor: 0.85,
          categoria: 'Preventivo',
        },
        {
          tipo_ratio_id: 2,
          tipo_ratio_nombre: 'Utilización',
          valor: 0.75,
          categoria: 'Correctivo',
        },
      ],
      comentario: 'Versión actualizada tras mantenimiento',
      usuario_id: 'user123',
    },
  })
  @IsOptional()
  @IsObject({ message: 'ratios_version debe ser un objeto JSON válido' })
  ratios_version?: RatiosVersion;

  @ApiPropertyOptional({
    description: 'Lugar de operación donde se registra el ratio',
    example: 'Mina Norte - Sector A',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'lugar_operacion debe ser una cadena de texto' })
  lugar_operacion?: string;
}
