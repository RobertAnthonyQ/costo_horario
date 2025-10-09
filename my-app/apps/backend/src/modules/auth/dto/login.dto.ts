import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'mipassword',
    minLength: 3,
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(3, { message: 'La contraseña debe tener al menos 3 caracteres' })
  password: string;
}
