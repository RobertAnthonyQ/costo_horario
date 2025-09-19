import { PartialType } from '@nestjs/swagger';
import { CreateModeloComponentesHistoricoDto } from './create-modelo-componentes-historico.dto';

export class UpdateModeloComponentesHistoricoDto extends PartialType(
  CreateModeloComponentesHistoricoDto,
) {}
