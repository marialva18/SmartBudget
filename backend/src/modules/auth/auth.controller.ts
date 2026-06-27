import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { Public } from '../../common/auth/public.decorator';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService, type SessionContext } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ParseSqlServerGuidPipe } from '../../common/validation/sql-server-guid';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(
      dto,
      this.getSessionContext(request),
    );
    this.authCookieService.setRefreshToken(response, session.refreshToken);
    return session.response;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.authCookieService.getRefreshToken(request);
    const session = await this.authService.refresh(
      refreshToken,
      this.getSessionContext(request),
    );
    this.authCookieService.setRefreshToken(response, session.refreshToken);
    return session.response;
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user.userId);
  }

  @Get('sessions')
  sessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getSessions(user.userId, user.sessionId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = this.authCookieService.getRefreshToken(request);
    await this.authService.logout(user, refreshToken);
    this.authCookieService.clearRefreshToken(response);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('sessions/:sessionId')
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId', ParseSqlServerGuidPipe)
    sessionId: string,
  ): Promise<void> {
    await this.authService.revokeSession(user.userId, sessionId);
  }

  private getSessionContext(request: Request): SessionContext {
    const requestedPlatform = request.header('x-client-platform');
    const platform = requestedPlatform === 'MOBILE' ? 'MOBILE' : 'WEB';

    return {
      platform,
      ipAddress: request.ip,
      userAgent: request.header('user-agent')?.slice(0, 512),
      deviceName: request.header('x-device-name')?.slice(0, 120),
    };
  }
}