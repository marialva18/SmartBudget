import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthCookieService],
  exports: [JwtModule],
})
export class AuthModule {}
