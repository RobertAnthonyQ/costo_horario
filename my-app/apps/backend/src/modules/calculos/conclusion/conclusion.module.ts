import { Module } from '@nestjs/common';
import { ConclusionController } from './conclusion.controller';
import { ConclusionService } from './conclusion.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { FlujoCajaModule } from '../flujo-caja/flujo-caja.module';

@Module({
  imports: [
    PrismaModule,
    FlujoCajaModule, // Para acceder a los datos de flujo de caja
  ],
  controllers: [ConclusionController],
  providers: [ConclusionService],
  exports: [ConclusionService],
})
export class ConclusionModule {}
