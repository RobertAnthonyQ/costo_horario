import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AmortizacionParametrosDto {
  @ApiProperty({
    example: 4,
    description:
      'ID de la máquina para obtener parámetros de amortización del último informe de costo horario',
  })
  @IsNumber()
  machineId: number;
}
