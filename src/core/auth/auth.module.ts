import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/core/auth/auth.service';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [AuthService, ConfigService, JwtService],
  exports: [AuthService],
})
export class AuthModule {}
