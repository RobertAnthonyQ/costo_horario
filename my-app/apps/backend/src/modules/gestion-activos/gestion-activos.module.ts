import { Module } from '@nestjs/common';
import { MarcasController } from './marcas/marcas.controller';
import { MarcasService } from './marcas/marcas.service';
import { MachinesController } from './machines/machines.controller';
import { MachinesService } from './machines/machines.service';
import { EquipoController } from './equipo/equipo.controller';
import { EquipoService } from './equipo/equipo.service';
import { FlotaController } from './flota/flota.controller';
import { FlotaService } from './flota/flota.service';
import { ComponentesController } from './componentes/componentes.controller';
import { ComponentesService } from './componentes/componentes.service';
import { ModelosController } from './modelos/modelos.controller';
import { ModelosService } from './modelos/modelos.service';
import { TiposRatioController } from './tipos_ratio/tipos-ratio.controller';
import { TiposRatioService } from './tipos_ratio/tipos-ratio.service';
import { RatiosHistoricoController } from './ratios_historico/ratios-historico.controller';
import { RatiosHistoricoService } from './ratios_historico/ratios-historico.service';
import { ModeloComponentesHistoricoController } from './modelo_componentes_historico/modelo-componentes-historico.controller';
import { ModeloComponentesHistoricoService } from './modelo_componentes_historico/modelo-componentes-historico.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    MarcasController,
    MachinesController,
    EquipoController,
    FlotaController,
    ComponentesController,
    ModelosController,
    TiposRatioController,
    RatiosHistoricoController,
    ModeloComponentesHistoricoController,
  ],
  providers: [
    MarcasService,
    MachinesService,
    EquipoService,
    FlotaService,
    ComponentesService,
    ModelosService,
    TiposRatioService,
    RatiosHistoricoService,
    ModeloComponentesHistoricoService,
  ],
  exports: [
    MarcasService,
    MachinesService,
    EquipoService,
    FlotaService,
    ComponentesService,
    ModelosService,
    TiposRatioService,
    RatiosHistoricoService,
    ModeloComponentesHistoricoService,
  ], // Exportamos para que otros módulos puedan usarlos
})
export class GestionActivosModule {}
