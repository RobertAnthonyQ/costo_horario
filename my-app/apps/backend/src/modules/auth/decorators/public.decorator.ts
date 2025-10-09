import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para marcar rutas como públicas (sin autenticación)
 *
 * Uso:
 * @Public()
 * @Post('login')
 * async login() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
