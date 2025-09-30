import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ExtractEscenariosDto {
  @ApiProperty({
    example: 4,
    description: 'ID de la máquina para extraer escenarios de horas',
  })
  @IsNumber()
  machineId: number;
}
