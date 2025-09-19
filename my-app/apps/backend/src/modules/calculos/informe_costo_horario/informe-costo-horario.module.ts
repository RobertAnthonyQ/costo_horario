import { Module } from '@nestjs/common';
import { InformeCostoHorarioService } from './informe-costo-horario.service';
import { InformeCostoHorarioController } from './informe-costo-horario.controller';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ModeloComponentesHistoricoModule } from '../../gestion-activos/modelo_componentes_historico/modelo-componentes-historico.module';
import { PosesionModule } from '../posesion/posesion.module';

@Module({
  imports: [ModeloComponentesHistoricoModule, PosesionModule],
  controllers: [InformeCostoHorarioController],
  providers: [InformeCostoHorarioService, PrismaService],
  exports: [InformeCostoHorarioService],
})
export class InformeCostoHorarioModule {}
