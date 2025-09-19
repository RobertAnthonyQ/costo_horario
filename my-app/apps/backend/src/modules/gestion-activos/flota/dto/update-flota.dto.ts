import { PartialType } from '@nestjs/swagger';
import { CreateFlotaDto } from './create-flota.dto';

export class UpdateFlotaDto extends PartialType(CreateFlotaDto) {}
