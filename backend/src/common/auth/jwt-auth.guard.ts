import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma/prisma.service';
import { es } from '../i18n/es';
import type { AuthenticatedUser } from './authenticated-user';
import { IS_PUBLIC_KEY } from './public.decorator';

type AccessTokenPayload = {
  sub: string;
  email: string;
  sid: string;
};

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(es.auth.loginRequired);
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        },
      );

      if (!payload.sub || !payload.email || !payload.sid) {
        throw new UnauthorizedException(es.auth.invalidSession);
      }

      const session = await this.prisma.userSession.findFirst({
        where: {
          id: payload.sid,
          userId: payload.sub,
          revokedAt: null,
          user: {
            status: 'ACTIVE',
          },
        },
        select: { id: true, platform: true },
      });

      if (
        !session ||
        (session.platform !== 'WEB' && session.platform !== 'MOBILE')
      ) {
        throw new UnauthorizedException(es.auth.invalidSession);
      }

      request.user = {
        userId: payload.sub,
        email: payload.email,
        sessionId: payload.sid,
        platform: session.platform,
      };

      return true;
    } catch {
      throw new UnauthorizedException(es.auth.expiredSession);
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
