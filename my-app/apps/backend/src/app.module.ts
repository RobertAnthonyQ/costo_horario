import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { GestionActivosModule } from './modules/gestion-activos/gestion-activos.module';
import { CalculosModule } from './modules/calculos/calculos.module';
import { InformesModule } from './modules/informes/informes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../../../.env'),
    }),
    SupabaseModule,
    PrismaModule,
    AuthModule, // ✅ Módulo de autenticación
    GestionActivosModule,
    CalculosModule,
    InformesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ✅ Configurar AuthGuard globalmente
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
