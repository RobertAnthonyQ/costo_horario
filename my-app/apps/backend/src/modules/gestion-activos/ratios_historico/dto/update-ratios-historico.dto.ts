import { PartialType } from '@nestjs/swagger';
import { CreateRatiosHistoricoDto } from './create-ratios-historico.dto';

export class UpdateRatiosHistoricoDto extends PartialType(
  CreateRatiosHistoricoDto,
) {}
