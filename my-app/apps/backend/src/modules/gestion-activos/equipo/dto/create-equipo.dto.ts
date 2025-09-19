import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEquipoDto {
  @ApiProperty({
    description: 'Nombre del equipo',
    example: 'Excavadora',
    type: String,
  })
  @IsString({ message: 'nombre debe ser un texto' })
  @IsNotEmpty({ message: 'nombre es requerido' })
  nombre: string;
}
