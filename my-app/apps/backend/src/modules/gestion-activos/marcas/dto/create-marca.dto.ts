import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMarcaDto {
  @ApiProperty({
    description: 'Nombre de la marca',
    example: 'Caterpillar',
    type: String,
  })
  @IsString({ message: 'nombre debe ser un texto' })
  @IsNotEmpty({ message: 'nombre es requerido' })
  nombre: string;
}
