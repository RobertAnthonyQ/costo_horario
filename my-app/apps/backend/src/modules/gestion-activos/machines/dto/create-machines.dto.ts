/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsNumber,
  IsString,
  IsOptional,
  IsPositive,
  IsInt,
  IsObject,
  ValidateNested,
  IsBoolean,
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

// DTO para datos adicionales de la máquina en otros_json
export class DatosAdicionalesMaquinaDto {
  @ApiPropertyOptional({
    description: 'País de procedencia de la máquina',
    example: 'Estados Unidos',
  })
  @IsOptional()
  @IsString({ message: 'procedencia_pais debe ser un texto' })
  procedencia_pais?: string;

  @ApiPropertyOptional({
    description: 'Potencia nominal en caballos de fuerza (HP)',
    example: '231 HP @ 2,000',
  })
  @IsOptional()
  @IsString({ message: 'potencia_nominal_hp debe ser texto' })
  potencia_nominal_hp?: string;

  @ApiPropertyOptional({
    description: 'Consumo de combustible en litros por hora',
    example: 15.5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'consumo_combustible_lh debe ser un número' })
  @IsPositive({ message: 'consumo_combustible_lh debe ser positivo' })
  @Type(() => Number)
  consumo_combustible_lh?: number;

  @ApiPropertyOptional({
    description: 'Número de equipos comercializados por la marca en Perú',
    example: 150,
  })
  @IsOptional()
  @IsInt({ message: 'equipos_comercializados_peru debe ser un entero' })
  @IsPositive({ message: 'equipos_comercializados_peru debe ser positivo' })
  @Type(() => Number)
  equipos_comercializados_peru?: number;

  @ApiPropertyOptional({
    description: 'Plazo de entrega del equipo en días',
    example: 45,
  })
  @IsOptional()
  @IsInt({ message: 'plazo_entrega_dias debe ser un entero' })
  @IsPositive({ message: 'plazo_entrega_dias debe ser positivo' })
  @Type(() => Number)
  plazo_entrega_dias?: number;

  @ApiPropertyOptional({
    description: 'Horas de capacitación a operadores y técnicos',
    example: 40,
  })
  @IsOptional()
  @IsInt({ message: 'capacitacion_horas debe ser un entero' })
  @IsPositive({ message: 'capacitacion_horas debe ser positivo' })
  @Type(() => Number)
  capacitacion_horas?: number;

  @ApiPropertyOptional({
    description: 'Tiempo promedio de atención de repuestos en días',
    example: '3-5',
  })
  @IsOptional()
  @IsString({ message: 'tiempo_atencion_repuestos_dias debe ser texto' })
  tiempo_atencion_repuestos_dias?: string;

  @ApiPropertyOptional({
    description: 'Indica si ofrece financiamiento',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'ofrece_financiamiento debe ser un booleano' })
  @Type(() => Boolean)
  ofrece_financiamiento?: boolean;
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
    description: 'Datos adicionales estructurados de la máquina',
    type: DatosAdicionalesMaquinaDto,
    example: {
      procedencia_pais: 'Estados Unidos',
      potencia_nominal_hp: 200,
      consumo_combustible_lh: 15.5,
      equipos_comercializados_peru: 150,
      plazo_entrega_dias: 45,
      capacitacion_horas: 40,
      ofrece_financiamiento: true,
    },
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DatosAdicionalesMaquinaDto)
  otros_json?: DatosAdicionalesMaquinaDto | null;

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
