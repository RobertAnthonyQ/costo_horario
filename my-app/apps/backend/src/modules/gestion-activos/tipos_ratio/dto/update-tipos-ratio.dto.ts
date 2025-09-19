import { PartialType } from '@nestjs/swagger';
import { CreateTiposRatioDto } from './create-tipos-ratio.dto';

export class UpdateTiposRatioDto extends PartialType(CreateTiposRatioDto) {}
