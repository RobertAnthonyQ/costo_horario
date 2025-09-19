import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoRatioCategoria {
  Preventivo = 'Preventivo',
  Correctivo = 'Correctivo',
  Neumaticos = 'Neumaticos',
  Estructural = 'Estructural',
  Desgaste = 'Desgaste',
}

export class CreateTiposRatioDto {
  @ApiProperty({
    description: 'Nombre del tipo de ratio',
    example: 'Disponibilidad',
    type: String,
  })
  @IsString({ message: 'nombre debe ser un texto' })
  @IsNotEmpty({ message: 'nombre es requerido' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Categoría del tipo de ratio',
    enum: TipoRatioCategoria,
    example: TipoRatioCategoria.Preventivo,
  })
  @IsOptional()
  @IsEnum(TipoRatioCategoria, {
    message:
      'categoria debe ser uno de los valores válidos: Preventivo, Correctivo, Neumaticos, Estructural, Desgaste',
  })
  categoria?: TipoRatioCategoria;
}
