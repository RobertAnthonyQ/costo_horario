import { Module } from '@nestjs/common';
import { TiposRatioService } from './tipos-ratio.service';
import { TiposRatioController } from './tipos-ratio.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TiposRatioController],
  providers: [TiposRatioService],
  exports: [TiposRatioService],
})
export class TiposRatioModule {}
