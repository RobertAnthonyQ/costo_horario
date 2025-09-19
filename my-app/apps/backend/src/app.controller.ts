import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('config')
  getConfig() {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      supabaseUrl: process.env.SUPABASE_URL
        ? 'Configured ✅'
        : 'Not configured ❌',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
        ? 'Configured ✅'
        : 'Not configured ❌',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? 'Configured ✅'
        : 'Not configured ❌',
      port: process.env.BACKEND_PORT || '3001 (default)',
      hasSupabaseClient: !!this.supabaseService.getClient(),
      hasSupabaseAdminClient: !!this.supabaseService.getAdminClient(),
    };
  }

  @Get('test-db')
  async testDatabase() {
    try {
      const isConnected = await this.supabaseService.testConnection();
      return {
        status: isConnected ? 'Connected ✅' : 'Failed ❌',
        timestamp: new Date().toISOString(),
        message: isConnected
          ? 'Database connection successful'
          : 'Database connection failed',
      };
    } catch (error) {
      return {
        status: 'Error ❌',
        timestamp: new Date().toISOString(),
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
