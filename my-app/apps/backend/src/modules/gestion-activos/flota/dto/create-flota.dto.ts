import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlotaDto {
  @ApiProperty({
    description: 'Nombre de la flota',
    example: 'Flota Minería',
    type: String,
  })
  @IsString({ message: 'nombre debe ser un texto' })
  @IsNotEmpty({ message: 'nombre es requerido' })
  nombre: string;
}
