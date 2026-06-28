import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthCookieService } from './auth-cookie.service';

describe('AuthCookieService', () => {
  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads the refresh token from parsed cookies', () => {
    const service = createService('development');
    const request = {
      cookies: { smartbudget_refresh: 'token-id.token-secret' },
    } as unknown as Request;

    expect(service.getRefreshToken(request)).toBe('token-id.token-secret');
  });

  it('sets an HttpOnly non-secure cookie in development', () => {
    const service = createService('development');

    service.setRefreshToken(
      response as unknown as Response,
      'token-id.token-secret',
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'smartbudget_refresh',
      'token-id.token-secret',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/api/v1/auth',
      }),
    );
  });

  it('sets a cross-site compatible Secure cookie in production', () => {
    const service = createService('production');

    service.setRefreshToken(
      response as unknown as Response,
      'token-id.token-secret',
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'smartbudget_refresh',
      'token-id.token-secret',
      expect.objectContaining({ sameSite: 'none', secure: true }),
    );
  });

  function createService(nodeEnv: string): AuthCookieService {
    const values: Record<string, string | number> = {
      NODE_ENV: nodeEnv,
      API_PREFIX: 'api/v1',
      REFRESH_COOKIE_MAX_AGE_MS: 604_800_000,
    };
    const configService = {
      get: (key: string, fallback: unknown) => values[key] ?? fallback,
    };

    return new AuthCookieService(configService as unknown as ConfigService);
  }
});
