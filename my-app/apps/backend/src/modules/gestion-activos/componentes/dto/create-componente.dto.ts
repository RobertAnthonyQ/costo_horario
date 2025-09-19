import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComponenteDto {
  @ApiProperty({
    description: 'Nombre del componente',
    example: 'Motor',
    type: String,
  })
  @IsString({ message: 'nombre debe ser un texto' })
  @IsNotEmpty({ message: 'nombre es requerido' })
  nombre: string;
}
