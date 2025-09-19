import { Module } from '@nestjs/common';
import { PosesionService } from './posesion.service';
import { PosesionController } from './posesion.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PosesionController],
  providers: [PosesionService],
  exports: [PosesionService], // Por si otros módulos necesitan usar este servicio
})
export class PosesionModule {}
