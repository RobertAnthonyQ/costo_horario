import { Module } from '@nestjs/common';
import { RatiosHistoricoService } from './ratios-historico.service';
import { RatiosHistoricoController } from './ratios-historico.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RatiosHistoricoController],
  providers: [RatiosHistoricoService],
  exports: [RatiosHistoricoService],
})
export class RatiosHistoricoModule {}
