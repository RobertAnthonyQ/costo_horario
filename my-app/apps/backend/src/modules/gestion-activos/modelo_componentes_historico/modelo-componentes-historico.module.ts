import { Module } from '@nestjs/common';
import { ModeloComponentesHistoricoService } from './modelo-componentes-historico.service';
import { ModeloComponentesHistoricoController } from './modelo-componentes-historico.controller';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Module({
  controllers: [ModeloComponentesHistoricoController],
  providers: [ModeloComponentesHistoricoService, PrismaService],
  exports: [ModeloComponentesHistoricoService],
})
export class ModeloComponentesHistoricoModule {}
