import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard de autenticación que verifica el JWT en cada request
 *
 * - Verifica si la ruta es pública (@Public())
 * - Extrae el token del header Authorization
 * - Valida el token con Supabase
 * - Adjunta el usuario a la request
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('No se proporcionó token de autenticación');
      throw new UnauthorizedException('Token de autenticación requerido');
    }

    try {
      // Verificar token con Supabase
      const user = await this.authService.verifyToken(token);

      if (!user) {
        this.logger.warn('Token inválido o expirado');
        throw new UnauthorizedException('Token inválido o expirado');
      }

      // Adjuntar usuario a la request para uso posterior
      request.user = user;

      this.logger.debug(`Usuario autenticado: ${user.email}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error al verificar token: ${error.message}`);
      throw new UnauthorizedException('Error al verificar autenticación');
    }
  }

  /**
   * Extrae el token del header Authorization
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
