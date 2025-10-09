import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { SupabaseModule } from '../../supabase/supabase.module';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [SupabaseModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
