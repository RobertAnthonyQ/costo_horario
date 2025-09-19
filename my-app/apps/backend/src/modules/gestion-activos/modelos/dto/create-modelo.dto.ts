import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModeloDto {
  @ApiProperty({
    description: 'Nombre del modelo',
    example: 'CAT 320D',
    type: String,
  })
  @IsString({ message: 'nombre debe ser un texto' })
  @IsNotEmpty({ message: 'nombre es requerido' })
  nombre: string;

  @ApiProperty({
    description: 'ID de la marca (requerido)',
    example: 1,
    type: Number,
  })
  @IsNumber({}, { message: 'marca_id debe ser un número' })
  @IsInt({ message: 'marca_id debe ser un entero' })
  @IsPositive({ message: 'marca_id debe ser positivo' })
  @Type(() => Number)
  marca_id: number;

  @ApiPropertyOptional({
    description: 'ID del equipo (opcional)',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'equipo_id debe ser un número' })
  @IsInt({ message: 'equipo_id debe ser un entero' })
  @IsPositive({ message: 'equipo_id debe ser positivo' })
  @Type(() => Number)
  equipo_id?: number;

  @ApiPropertyOptional({
    description: 'ID de la flota (opcional)',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'flota_id debe ser un número' })
  @IsInt({ message: 'flota_id debe ser un entero' })
  @IsPositive({ message: 'flota_id debe ser positivo' })
  @Type(() => Number)
  flota_id?: number;

  @ApiPropertyOptional({
    description: 'Porcentaje de utilidad (0-100)',
    example: 15.5,
    type: Number,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'porcentaje_utilidad debe ser un número' })
  @Min(0, { message: 'porcentaje_utilidad debe ser mayor o igual a 0' })
  @Max(100, { message: 'porcentaje_utilidad debe ser menor o igual a 100' })
  @Type(() => Number)
  porcentaje_utilidad?: number;

  @ApiPropertyOptional({
    description: 'Vida útil según fabricante (años)',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'vida_util_fabricante debe ser un entero' })
  @IsPositive({ message: 'vida_util_fabricante debe ser positivo' })
  @Type(() => Number)
  vida_util_fabricante?: number;
}
