import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateAnalisisFlujoDto {
  @ApiProperty({
    example: 4,
    description:
      'ID de la máquina para análisis de flujo de caja (se tomará automáticamente el informe más reciente)',
  })
  @IsNumber()
  machineId: number;

  // Campos que se precargan automáticamente desde informe_costo_horario
  // pero que el usuario puede modificar

  @ApiProperty({
    example: 0.1,
    description: 'Porcentaje residual (decimal). Ejemplo: 0.10 para 10%',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  porcentajeResidual?: number;

  @ApiProperty({
    example: 0.05,
    description: 'Margen interno (decimal). Ejemplo: 0.05 para 5%',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  margenInterno?: number;

  @ApiProperty({
    example: 0.05,
    description:
      'Porcentaje de gastos generales de mantenimiento (decimal). Ejemplo: 0.05 para 5%',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  gastosGeneralesMantenimiento?: number;

  @ApiProperty({
    example: 300,
    description: 'Horas operativas por mes',
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  horasOperativasMes?: number;

  @ApiProperty({
    example: 0.08,
    description:
      'Tasa de descuento de la empresa (decimal). Ejemplo: 0.08 para 8%',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  tasaDescuentoEmpresa?: number;

  @ApiProperty({
    example: 'Análisis de flujo de caja para CAT 950',
    description: 'Comentario opcional del análisis',
    required: false,
  })
  @IsString()
  @IsOptional()
  comentario?: string;
}
