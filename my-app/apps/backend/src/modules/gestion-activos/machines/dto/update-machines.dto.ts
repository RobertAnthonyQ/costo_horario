import { PartialType } from '@nestjs/swagger';
import {
  CreateMachinesDto,
  DatosAdicionalesMaquinaDto,
} from './create-machines.dto';

export class UpdateMachinesDto extends PartialType(CreateMachinesDto) {}

// Exportar también el DTO de datos adicionales para uso externo
export { DatosAdicionalesMaquinaDto };
