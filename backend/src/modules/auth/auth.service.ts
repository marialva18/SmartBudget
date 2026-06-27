import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import * as nodemailer from 'nodemailer';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

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

type MessageResponse = {
  message: string;
};

type EmailConfig = {
  provider: 'resend' | 'smtp';
  from: string;
  resetAppUrl: string;
  verificationAppUrl: string;
  passwordResetExpiresInMinutes: number;
  emailVerificationExpiresInMinutes: number;
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<MessageResponse> {
    const emailConfig = this.getEmailConfig(es.auth.emailUnavailable);
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        status: true,
        emailVerifiedAt: true,
      },
    });

    if (existingUser) {
      if (existingUser.status !== 'ACTIVE' || existingUser.emailVerifiedAt) {
        throw new ConflictException(es.auth.registeredEmail);
      }

      await this.issueEmailVerification(
        existingUser.id,
        existingUser.email,
        emailConfig,
      );

      return {
        message: es.auth.emailVerificationSent,
      };
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
      select: {
        id: true,
        email: true,
      },
    });

    await this.issueEmailVerification(user.id, user.email, emailConfig);

    return {
      message: es.auth.emailVerificationSent,
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<MessageResponse> {
    const [tokenId, tokenSecret] = dto.token.split('.');

    if (!tokenId || !tokenSecret) {
      throw new UnauthorizedException(es.auth.invalidVerificationLink);
    }

    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { id: tokenId },
      });

    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException(es.auth.invalidVerificationLink);
    }

    const matches = await argon2.verify(
      verificationToken.tokenHash,
      tokenSecret,
    );

    if (!matches) {
      throw new UnauthorizedException(es.auth.invalidVerificationLink);
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerifiedAt: now },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: now },
      }),
    ]);

    return {
      message: es.auth.emailVerified,
    };
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

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(es.auth.emailNotVerified);
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
      currentToken.user.status !== 'ACTIVE' ||
      !currentToken.user.emailVerifiedAt
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

  async forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponse> {
    const emailConfig = this.getEmailConfig(es.auth.recoveryUnavailable);
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerifiedAt: true,
      },
    });

    if (user?.emailVerifiedAt) {
      const resetTokenSecret = randomBytes(32).toString('base64url');
      const resetToken = await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: await argon2.hash(resetTokenSecret),
          expiresAt: this.addMinutes(
            emailConfig.passwordResetExpiresInMinutes,
          ),
        },
      });

      try {
        await this.sendPasswordRecoveryEmail(
          email,
          `${resetToken.id}.${resetTokenSecret}`,
          emailConfig,
        );
      } catch (error) {
        await this.prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        });

        throw error;
      }
    }

    return {
      message: es.auth.recoveryRequested,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<MessageResponse> {
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

  private async issueEmailVerification(
    userId: string,
    email: string,
    config: EmailConfig,
  ) {
    const verificationSecret = randomBytes(32).toString('base64url');
    const verificationToken =
      await this.prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: await argon2.hash(verificationSecret),
          expiresAt: this.addMinutes(
            config.emailVerificationExpiresInMinutes,
          ),
        },
      });

    try {
      await this.sendEmailVerificationEmail(
        email,
        `${verificationToken.id}.${verificationSecret}`,
        config,
      );
    } catch (error) {
      await this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });

      throw error;
    }
  }

  private getEmailConfig(errorMessage: string): EmailConfig {
    const provider = this.configService
      .get<string>('EMAIL_PROVIDER', '')
      .trim();

    const from = this.configService.get<string>('EMAIL_FROM', '').trim();
    const resetAppUrl = this.configService
      .get<string>('PASSWORD_RESET_APP_URL', '')
      .trim();
    const verificationAppUrl = this.configService
      .get<string>('EMAIL_VERIFICATION_APP_URL', '')
      .trim();

    const passwordResetExpiresInMinutes = this.configService.get<number>(
      'PASSWORD_RESET_EXPIRES_IN_MINUTES',
      30,
    );
    const emailVerificationExpiresInMinutes = this.configService.get<number>(
      'EMAIL_VERIFICATION_EXPIRES_IN_MINUTES',
      1440,
    );

    if (!from || !resetAppUrl || !verificationAppUrl) {
      throw new ServiceUnavailableException(errorMessage);
    }

    if (provider === 'resend') {
      const resendApiKey = this.configService
        .get<string>('RESEND_API_KEY', '')
        .trim();

      if (!resendApiKey) {
        throw new ServiceUnavailableException(errorMessage);
      }

      return {
        provider,
        from,
        resetAppUrl,
        verificationAppUrl,
        passwordResetExpiresInMinutes,
        emailVerificationExpiresInMinutes,
        resendApiKey,
      };
    }

    if (provider === 'smtp') {
      const smtpHost = this.configService.get<string>('SMTP_HOST', '').trim();
      const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
      const smtpSecure = this.configService.get<boolean>(
        'SMTP_SECURE',
        false,
      );
      const smtpUser = this.configService.get<string>('SMTP_USER', '').trim();
      const smtpPass = this.configService.get<string>('SMTP_PASS', '').trim();

      if (!smtpHost || !smtpUser || !smtpPass) {
        throw new ServiceUnavailableException(errorMessage);
      }

      return {
        provider,
        from,
        resetAppUrl,
        verificationAppUrl,
        passwordResetExpiresInMinutes,
        emailVerificationExpiresInMinutes,
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPass,
      };
    }

    throw new ServiceUnavailableException(errorMessage);
  }

  private async sendPasswordRecoveryEmail(
    email: string,
    token: string,
    config: EmailConfig,
  ) {
    const resetUrl = `${config.resetAppUrl.replace(
  /\/+$/g,
  '',
)}?token=${encodeURIComponent(token)}`;
    await this.sendEmail({
      config,
      to: email,
      subject: 'Recupera tu contraseña de Qori',
      html: [
        '<p>Recibimos una solicitud para restablecer tu contraseña.</p>',
        `<p><a href="${resetUrl}">Restablecer contraseña</a></p>`,
        '<p>Si no solicitaste este cambio, puedes ignorar este correo.</p>',
      ].join(''),
    });
  }

  private async sendEmailVerificationEmail(
    email: string,
    token: string,
    config: EmailConfig,
  ) {
    const verificationUrl = `${config.verificationAppUrl.replace(
      /\/+$/g,
      '',
    )}?token=${encodeURIComponent(token)}`;

    await this.sendEmail({
      config,
      to: email,
      subject: 'Verifica tu cuenta de Qori',
      html: [
        '<p>Gracias por crear tu cuenta en Qori.</p>',
        '<p>Para activar tu cuenta, confirma tu correo usando este enlace:</p>',
        `<p><a href="${verificationUrl}">Verificar mi correo</a></p>`,
        '<p>Si no creaste esta cuenta, puedes ignorar este correo.</p>',
      ].join(''),
    });
  }

  private async sendEmail({
    config,
    to,
    subject,
    html,
  }: {
    config: EmailConfig;
    to: string;
    subject: string;
    html: string;
  }) {
    if (config.provider === 'resend') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.from,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        throw new ServiceUnavailableException(es.auth.emailUnavailable);
      }

      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    try {
      await transporter.sendMail({
        from: config.from,
        to,
        subject,
        html,
      });
    } catch {
      throw new ServiceUnavailableException(es.auth.emailUnavailable);
    }
  }

  private addMinutes(minutes: number): Date {
    return new Date(Date.now() + minutes * 60_000);
  }
}