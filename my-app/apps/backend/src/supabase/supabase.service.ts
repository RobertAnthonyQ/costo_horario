import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient<Database>;
  private supabaseAdmin: SupabaseClient<Database>;

  constructor() {
    // Cliente público (con anon key)
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );

    // Cliente admin (con service role key)
    this.supabaseAdmin = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    this.logger.log('Supabase clients initialized');
  }

  /**
   * Cliente público de Supabase (con anon key)
   * Usa este para operaciones que respetan RLS (Row Level Security)
   */
  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }

  /**
   * Cliente admin de Supabase (con service role key)
   * Usa este para operaciones administrativas que bypasean RLS
   */
  getAdminClient(): SupabaseClient<Database> {
    return this.supabaseAdmin;
  }

  /**
   * Método helper para manejar errores de Supabase
   */
  handleError(error: any, context?: string) {
    const errorMessage = error?.message || 'Database error occurred';
    const errorContext = context ? `[${context}] ` : '';

    this.logger.error(`${errorContext}${errorMessage}`, error);
    throw new Error(errorMessage);
  }

  /**
   * Verificar conexión a la base de datos
   */
  async testConnection(): Promise<boolean> {
    try {
      // Usar una tabla que sabemos que existe
      const { data, error } = await this.supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = table not found, lo cual está bien
        throw error;
      }

      this.logger.log('Database connection successful');
      return true;
    } catch (error) {
      this.logger.error('Database connection failed', error);
      return false;
    }
  }
}
