import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MaquinaAnalisisDto {
  @ApiProperty({
    example: 4,
    description: 'ID de la máquina para incluir en el análisis comparativo',
  })
  @IsNumber()
  machineId: number;

  @ApiProperty({
    example: 12,
    description:
      'ID de la versión del análisis de flujo de caja de esta máquina',
  })
  @IsNumber()
  versionId: number;
}

export class CreateAnalisisConclusionDto {
  @ApiProperty({
    type: [MaquinaAnalisisDto],
    description:
      'Array de máquinas con sus respectivas versiones de flujo de caja para comparar',
    example: [
      { machineId: 4, versionId: 12 },
      { machineId: 7, versionId: 15 },
      { machineId: 9, versionId: 18 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaquinaAnalisisDto)
  maquinas: MaquinaAnalisisDto[];

  @ApiProperty({
    example: 'Oficina Central',
    description: 'Lugar de trabajo donde se realizará el análisis comparativo',
  })
  @IsString()
  lugarTrabajo: string;

  @ApiProperty({
    example: 'Análisis comparativo de excavadoras para proyecto minero',
    description: 'Comentario opcional del análisis comparativo',
    required: false,
  })
  @IsString()
  @IsOptional()
  comentario?: string;

  @ApiProperty({
    example: 'admin-user-uuid',
    description: 'ID del usuario que realiza el análisis',
    required: false,
  })
  @IsString()
  @IsOptional()
  usuarioId?: string;
}
