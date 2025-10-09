import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  AuthResponseDto,
} from './dto';
import { User, Session } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Registro de nuevo usuario
   */
  async signUp(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      const { email, password, full_name, avatar_url } = registerDto;

      this.logger.log(`Intentando registrar usuario: ${email}`);

      // Registrar usuario en Supabase Auth (SIN verificación de email)
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined, // Sin redirección de email
            data: {
              full_name: full_name || null,
              avatar_url: avatar_url || null,
            },
          },
        });

      if (error) {
        this.logger.error(`Error al registrar usuario: ${error.message}`);
        throw new BadRequestException(error.message);
      }

      if (!data.user) {
        throw new InternalServerErrorException('No se pudo crear el usuario');
      }

      // Crear registro en la tabla public.users
      try {
        await this.prismaService.public_users.create({
          data: {
            id: data.user.id,
            full_name: full_name || null,
            avatar_url: avatar_url || null,
          },
        });
        this.logger.log(`Usuario creado en public.users: ${data.user.email}`);
      } catch (prismaError: any) {
        this.logger.error(
          `Error al crear usuario en public.users: ${prismaError.message}`,
        );
        // No lanzamos error aquí, el usuario ya está en auth.users
      }

      this.logger.log(`Usuario registrado exitosamente: ${email}`);

      return {
        success: true,
        message: 'Usuario registrado exitosamente. Ya puedes iniciar sesión.',
        user: {
          id: data.user.id,
          email: data.user.email!,
          full_name: full_name,
          avatar_url: avatar_url,
          created_at: data.user.created_at,
        },
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in!,
              expires_at: data.session.expires_at!,
            }
          : undefined,
      };
    } catch (error: any) {
      this.logger.error(`Error en signUp: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      return {
        success: false,
        message: 'Error al registrar usuario',
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Inicio de sesión
   */
  async signIn(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const { email, password } = loginDto;

      this.logger.log(`Intentando login para: ${email}`);

      // Autenticar con Supabase
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        this.logger.warn(`Error al hacer login: ${error.message}`);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Obtener información adicional del usuario desde public.users
      let publicUser: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
      } | null = null;
      try {
        publicUser = await this.prismaService.public_users.findUnique({
          where: { id: data.user.id },
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
          },
        });
      } catch (error: any) {
        this.logger.warn(
          `No se pudo obtener info de public.users: ${error.message}`,
        );
      }

      this.logger.log(`Login exitoso para: ${email}`);

      return {
        success: true,
        message: 'Login exitoso',
        user: {
          id: data.user.id,
          email: data.user.email!,
          full_name:
            publicUser?.full_name || data.user.user_metadata?.full_name,
          avatar_url:
            publicUser?.avatar_url || data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at!,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error en signIn: ${error.message}`, error.stack);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      return {
        success: false,
        message: 'Error al iniciar sesión',
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Cierre de sesión
   */
  async signOut(accessToken: string): Promise<AuthResponseDto> {
    try {
      this.logger.log('Intentando cerrar sesión');

      const { error } = await this.supabaseService.getClient().auth.signOut();

      if (error) {
        this.logger.error(`Error al cerrar sesión: ${error.message}`);
        throw new InternalServerErrorException('Error al cerrar sesión');
      }

      this.logger.log('Sesión cerrada exitosamente');

      return {
        success: true,
        message: 'Sesión cerrada exitosamente',
      };
    } catch (error: any) {
      this.logger.error(`Error en signOut: ${error.message}`, error.stack);

      return {
        success: false,
        message: 'Error al cerrar sesión',
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Obtener usuario actual desde el token
   */
  async getCurrentUser(accessToken: string): Promise<AuthResponseDto> {
    try {
      this.logger.log('Obteniendo usuario actual');

      const { data, error } = await this.supabaseService
        .getClient()
        .auth.getUser(accessToken);

      if (error || !data.user) {
        this.logger.warn('Token inválido o expirado');
        throw new UnauthorizedException('Token inválido o expirado');
      }

      // Obtener información adicional del usuario
      let publicUser: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
      } | null = null;
      try {
        publicUser = await this.prismaService.public_users.findUnique({
          where: { id: data.user.id },
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
          },
        });
      } catch (error: any) {
        this.logger.warn(
          `No se pudo obtener info de public.users: ${error.message}`,
        );
      }

      return {
        success: true,
        message: 'Usuario obtenido exitosamente',
        user: {
          id: data.user.id,
          email: data.user.email!,
          full_name:
            publicUser?.full_name || data.user.user_metadata?.full_name,
          avatar_url:
            publicUser?.avatar_url || data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error en getCurrentUser: ${error.message}`,
        error.stack,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      return {
        success: false,
        message: 'Error al obtener usuario',
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Refrescar sesión con refresh token
   */
  async refreshSession(refreshToken: string): Promise<AuthResponseDto> {
    try {
      this.logger.log('Intentando refrescar sesión');

      const { data, error } = await this.supabaseService
        .getClient()
        .auth.refreshSession({ refresh_token: refreshToken });

      if (error || !data.session) {
        this.logger.warn('Refresh token inválido o expirado');
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }

      this.logger.log('Sesión refrescada exitosamente');

      return {
        success: true,
        message: 'Sesión refrescada exitosamente',
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at!,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error en refreshSession: ${error.message}`,
        error.stack,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      return {
        success: false,
        message: 'Error al refrescar sesión',
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<AuthResponseDto> {
    try {
      const { email } = resetPasswordDto;

      this.logger.log(`Solicitando recuperación de contraseña para: ${email}`);

      const { error } = await this.supabaseService
        .getClient()
        .auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`,
        });

      if (error) {
        this.logger.error(`Error al solicitar recuperación: ${error.message}`);
        throw new BadRequestException(error.message);
      }

      this.logger.log(`Email de recuperación enviado a: ${email}`);

      return {
        success: true,
        message:
          'Si el email existe, recibirás un enlace para restablecer tu contraseña',
      };
    } catch (error: any) {
      this.logger.error(
        `Error en resetPassword: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        success: false,
        message: 'Error al solicitar recuperación de contraseña',
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Verificar si un token es válido
   */
  async verifyToken(accessToken: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .auth.getUser(accessToken);

      if (error || !data.user) {
        return null;
      }

      return data.user;
    } catch (error: any) {
      this.logger.error(`Error al verificar token: ${error.message}`);
      return null;
    }
  }
}
