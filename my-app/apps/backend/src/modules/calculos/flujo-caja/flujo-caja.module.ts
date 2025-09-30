import { Module } from '@nestjs/common';
import { FlujoCajaController } from './flujo-caja.controller';
import { FlujoCajaService } from './flujo-caja.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { InformeCostoHorarioModule } from '../informe_costo_horario/informe-costo-horario.module';

@Module({
  imports: [
    PrismaModule,
    InformeCostoHorarioModule, // Para obtener datos del informe de costo horario
  ],
  controllers: [FlujoCajaController],
  providers: [FlujoCajaService],
  exports: [FlujoCajaService],
})
export class FlujoCajaModule {}
