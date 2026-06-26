import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };
  const prisma = {
    userSession: {
      findFirst: jest.fn(),
    },
  };

  const createContext = (request: Partial<Request>): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(
      reflector as unknown as Reflector,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  it('allows routes marked as public', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects requests without a bearer token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a valid token when its session was revoked', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      sid: 'session-id',
    });
    prisma.userSession.findFirst.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        createContext({
          headers: { authorization: 'Bearer valid-token' },
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the authenticated user for an active session', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.com',
      sid: 'session-id',
    });
    prisma.userSession.findFirst.mockResolvedValue({
      id: 'session-id',
      platform: 'WEB',
    });
    const request = {
      headers: { authorization: 'Bearer valid-token' },
    } as Partial<Request> & { user?: unknown };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({
      userId: 'user-id',
      email: 'user@example.com',
      sessionId: 'session-id',
      platform: 'WEB',
    });
  });
});
