import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'nuevo.usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({
    description:
      'Contraseña del usuario (mínimo 3 caracteres, solo minúsculas permitidas)',
    example: 'mipassword',
    minLength: 3,
  })
  @IsString({ message: 'La contraseña debe ser un texto' })
  @MinLength(3, { message: 'La contraseña debe tener al menos 3 caracteres' })
  password: string;

  @ApiPropertyOptional({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional({
    description: 'URL del avatar del usuario',
    example: 'https://ejemplo.com/avatar.jpg',
  })
  @IsString({ message: 'La URL del avatar debe ser un texto' })
  @IsOptional()
  avatar_url?: string;
}
