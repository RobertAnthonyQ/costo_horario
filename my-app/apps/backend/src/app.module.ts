import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { PrismaModule } from './core/prisma/prisma.module';
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
    GestionActivosModule,
    CalculosModule,
    InformesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
