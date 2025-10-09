import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Login exitoso',
  })
  message: string;

  @ApiProperty({
    description: 'Datos del usuario autenticado',
    required: false,
  })
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at?: string;
  };

  @ApiProperty({
    description: 'Información de la sesión',
    required: false,
  })
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  };

  @ApiProperty({
    description: 'Mensaje de error si la operación falló',
    required: false,
  })
  error?: string;
}
