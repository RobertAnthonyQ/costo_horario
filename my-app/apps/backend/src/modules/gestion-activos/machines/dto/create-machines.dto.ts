/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsNumber,
  IsString,
  IsOptional,
  IsPositive,
  IsInt,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// DTO para crear un modelo automáticamente
export class CreateModeloDataDto {
  @ApiPropertyOptional({
    description: 'Nombre del modelo',
    example: 'CAT320D',
  })
  @IsString({ message: 'nombre debe ser un texto' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'ID de la marca',
    example: 1,
  })
  @IsNumber({}, { message: 'marca_id debe ser un número' })
  @Type(() => Number)
  marca_id: number;

  @ApiPropertyOptional({
    description: 'ID del equipo',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'equipo_id debe ser un número' })
  @Type(() => Number)
  equipo_id?: number;

  @ApiPropertyOptional({
    description: 'ID de la flota',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'flota_id debe ser un número' })
  @Type(() => Number)
  flota_id?: number;

  @ApiPropertyOptional({
    description: 'Porcentaje de utilidad',
    example: 0.1,
  })
  @IsNumber({}, { message: 'porcentaje_utilidad debe ser un número' })
  @Type(() => Number)
  porcentaje_utilidad: number;

  @ApiPropertyOptional({
    description: 'Vida útil del fabricante en horas',
    example: 30000,
  })
  @IsOptional()
  @IsInt({ message: 'vida_util_fabricante debe ser un entero' })
  @IsPositive({ message: 'vida_util_fabricante debe ser positivo' })
  @Type(() => Number)
  vida_util_fabricante?: number;
}

export class CreateMachinesDto {
  @ApiPropertyOptional({
    description: 'ID del modelo',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'modelo_id debe ser un número' })
  @Type(() => Number)
  modelo_id?: number;

  @ApiPropertyOptional({
    description: 'Estado de la máquina',
    example: 'activo',
  })
  @IsOptional()
  @IsString({ message: 'estado debe ser un texto' })
  estado?: string;

  @ApiPropertyOptional({
    description: 'Horómetro inicial',
    example: 0,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'horometro_inicial debe ser un entero' })
  @Type(() => Number)
  horometro_inicial?: number;

  // Campo id_equipo_interno removido - se genera automáticamente basado en Equipo + Marca + Modelo

  @ApiPropertyOptional({
    description: 'URL de la imagen',
    example: 'https://example.com/foto.jpg',
  })
  @IsOptional()
  @IsString({ message: 'link_imagen debe ser un texto' })
  link_imagen?: string;

  @ApiPropertyOptional({
    description: 'Política de depreciación',
    example: 0.15,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'politica_depreciacion debe ser un entero' })
  @Type(() => Number)
  politica_depreciacion?: number;

  @ApiPropertyOptional({
    description: 'Tiempo de entrega (días)',
    example: 30,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'tiempo_entrega debe ser un entero' })
  @Type(() => Number)
  tiempo_entrega?: number;

  @ApiPropertyOptional({
    description: 'Valor similar nuevo (USD)',
    example: 100000,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'valor_similar_nuevo debe ser un número' })
  @IsPositive({ message: 'valor_similar_nuevo debe ser positivo' })
  @Type(() => Number)
  valor_similar_nuevo?: number;

  @ApiPropertyOptional({
    description: 'Valor de venta (USD)',
    example: 80000,
    type: Number,
  })
  @IsOptional()
  @IsNumber({}, { message: 'valor_venta debe ser un número' })
  @IsPositive({ message: 'valor_venta debe ser positivo' })
  @Type(() => Number)
  valor_venta?: number;

  @ApiPropertyOptional({
    description: 'Vida útil (años)',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'vida_util debe ser un entero' })
  @IsPositive({ message: 'vida_util debe ser positivo' })
  @Type(() => Number)
  vida_util?: number;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales',
    example: { color: 'amarillo' },
  })
  @IsOptional()
  @Type(() => Object)
  otros_json?: Record<string, any> | null; // Mejor tipado para JSON

  @ApiPropertyOptional({
    description:
      'Datos para crear el modelo automáticamente (solo para creación)',
    type: CreateModeloDataDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateModeloDataDto)
  modelo_data?: CreateModeloDataDto;
}
