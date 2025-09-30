import { Module } from '@nestjs/common';
import { CalculosService } from './calculos.service';
import { CalculosController } from './calculos.controller';
import { PosesionModule } from './posesion/posesion.module';
import { InformeCostoHorarioModule } from './informe_costo_horario/informe-costo-horario.module';
import { FlujoCajaModule } from './flujo-caja/flujo-caja.module';

@Module({
  imports: [PosesionModule, InformeCostoHorarioModule, FlujoCajaModule],
  providers: [CalculosService],
  controllers: [CalculosController],
})
export class CalculosModule {}
