import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  onboardingCompleted: boolean;
};

export type SessionContext = {
  platform: 'WEB' | 'MOBILE';
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
};

type SessionResult = {
  refreshToken: string;
  response: {
    user: AuthUser;
    accessToken: string;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    context: SessionContext,
  ): Promise<SessionResult> {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(es.auth.registeredEmail);
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        status: 'ACTIVE',
        profile: {
          create: {
            displayName: dto.displayName.trim(),
          },
        },
      },
      include: { profile: true },
    });

    return this.createSession(
      {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName ?? dto.displayName.trim(),
        onboardingCompleted: user.profile?.onboardingCompleted ?? false,
      },
      context,
    );
  }

  async login(dto: LoginDto, context: SessionContext): Promise<SessionResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException(es.auth.invalidCredentials);
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(es.auth.invalidCredentials);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.createSession(
      {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName ?? user.email,
        onboardingCompleted: user.profile?.onboardingCompleted ?? false,
      },
      context,
    );
  }

  async refresh(
    serializedToken: string | undefined,
    context: SessionContext,
  ): Promise<SessionResult> {
    const [tokenId, tokenSecret] = this.parseRefreshToken(serializedToken);
    const currentToken = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
      include: {
        session: true,
        user: {
          include: { profile: true },
        },
      },
    });

    if (
      !currentToken ||
      !currentToken.session ||
      currentToken.revokedAt ||
      currentToken.session.revokedAt ||
      currentToken.expiresAt <= new Date() ||
      currentToken.user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException(es.auth.invalidSession);
    }

    const matches = await argon2.verify(currentToken.tokenHash, tokenSecret);
    if (!matches) {
      throw new UnauthorizedException(es.auth.invalidSession);
    }

    const nextSecret = randomBytes(48).toString('base64url');
    const nextHash = await argon2.hash(nextSecret);
    const expiresAt = this.getRefreshExpiration();
    const now = new Date();

    const nextToken = await this.prisma.$transaction(async (transaction) => {
      const revoked = await transaction.refreshToken.updateMany({
        where: { id: currentToken.id, revokedAt: null },
        data: { revokedAt: now },
      });

      if (revoked.count !== 1) {
        throw new UnauthorizedException(es.auth.invalidSession);
      }

      await transaction.userSession.update({
        where: { id: currentToken.session!.id },
        data: {
          lastSeenAt: now,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          deviceName: context.deviceName ?? currentToken.session!.deviceName,
        },
      });

      return transaction.refreshToken.create({
        data: {
          userId: currentToken.userId,
          sessionId: currentToken.session!.id,
          tokenHash: nextHash,
          expiresAt,
        },
      });
    });

    const user = {
      id: currentToken.user.id,
      email: currentToken.user.email,
      displayName:
        currentToken.user.profile?.displayName ?? currentToken.user.email,
      onboardingCompleted:
        currentToken.user.profile?.onboardingCompleted ?? false,
    };

    return {
      refreshToken: `${nextToken.id}.${nextSecret}`,
      response: {
        user,
        accessToken: await this.signAccessToken(user, currentToken.session.id),
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: 'ACTIVE' },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException(es.auth.invalidSession);
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.profile?.displayName ?? user.email,
      preferredCurrency: user.profile?.preferredCurrency ?? 'PEN',
      timezone: user.profile?.timezone ?? 'America/Lima',
      theme: user.profile?.theme ?? 'SYSTEM',
      onboardingCompleted: user.profile?.onboardingCompleted ?? false,
    };
  }

  async getSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        deviceName: true,
        ipAddress: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });

    return sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    }));
  }

  async logout(
    user: AuthenticatedUser,
    serializedToken: string | undefined,
  ): Promise<void> {
    if (serializedToken) {
      const [tokenId, tokenSecret] = this.parseRefreshToken(serializedToken);
      const token = await this.prisma.refreshToken.findFirst({
        where: {
          id: tokenId,
          userId: user.userId,
          sessionId: user.sessionId,
          revokedAt: null,
        },
      });

      if (token && (await argon2.verify(token.tokenHash, tokenSecret))) {
        await this.revokeSession(user.userId, user.sessionId);
        return;
      }
    }

    await this.revokeSession(user.userId, user.sessionId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(es.auth.missingSession);
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.userSession.update({
        where: { id: session.id },
        data: { revokedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { sessionId: session.id, userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      const resetTokenSecret = randomBytes(32).toString('base64url');
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: await argon2.hash(resetTokenSecret),
          expiresAt: this.addDays(1),
        },
      });
    }

    return {
      message: es.auth.recoveryRequested,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const [tokenId, tokenSecret] = dto.token.split('.');

    if (!tokenId || !tokenSecret) {
      throw new UnauthorizedException(es.auth.invalidResetLink);
    }

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { id: tokenId },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException(es.auth.invalidResetLink);
    }

    const matches = await argon2.verify(resetToken.tokenHash, tokenSecret);
    if (!matches) {
      throw new UnauthorizedException(es.auth.invalidResetLink);
    }

    const passwordHash = await argon2.hash(dto.password);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.userSession.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    return {
      message: es.auth.passwordUpdated,
    };
  }

  private async createSession(
    user: AuthUser,
    context: SessionContext,
  ): Promise<SessionResult> {
    const refreshSecret = randomBytes(48).toString('base64url');
    const refreshHash = await argon2.hash(refreshSecret);
    const expiresAt = this.getRefreshExpiration();

    const result = await this.prisma.$transaction(async (transaction) => {
      const session = await transaction.userSession.create({
        data: {
          userId: user.id,
          platform: context.platform,
          deviceName: context.deviceName,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          lastSeenAt: new Date(),
        },
      });

      const refreshToken = await transaction.refreshToken.create({
        data: {
          userId: user.id,
          sessionId: session.id,
          tokenHash: refreshHash,
          expiresAt,
        },
      });

      return { session, refreshToken };
    });

    return {
      refreshToken: `${result.refreshToken.id}.${refreshSecret}`,
      response: {
        user,
        accessToken: await this.signAccessToken(user, result.session.id),
      },
    };
  }

  private signAccessToken(user: AuthUser, sessionId: string): Promise<string> {
    const options: JwtSignOptions = {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRES_IN',
        '15m',
      ) as NonNullable<JwtSignOptions['expiresIn']>,
    };

    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        sid: sessionId,
      },
      options,
    );
  }

  private parseRefreshToken(
    serializedToken: string | undefined,
  ): [string, string] {
    const [tokenId, tokenSecret] = serializedToken?.split('.') ?? [];
    if (!tokenId || !tokenSecret) {
      throw new UnauthorizedException(es.auth.invalidSession);
    }
    return [tokenId, tokenSecret];
  }

  private getRefreshExpiration(): Date {
    const maxAge = this.configService.get<number>(
      'REFRESH_COOKIE_MAX_AGE_MS',
      604_800_000,
    );
    return new Date(Date.now() + maxAge);
  }

  private addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
