import { Module } from '@nestjs/common';
import { CalculosService } from './calculos.service';
import { CalculosController } from './calculos.controller';
import { PosesionModule } from './posesion/posesion.module';
import { InformeCostoHorarioModule } from './informe_costo_horario/informe-costo-horario.module';

@Module({
  imports: [PosesionModule, InformeCostoHorarioModule],
  providers: [CalculosService],
  controllers: [CalculosController],
})
export class CalculosModule {}
