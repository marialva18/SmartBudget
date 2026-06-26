import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

const REFRESH_COOKIE_NAME = 'smartbudget_refresh';

type RequestWithCookies = Request & {
  cookies?: Record<string, unknown>;
};

@Injectable()
export class AuthCookieService {
  constructor(private readonly configService: ConfigService) {}

  getRefreshToken(request: RequestWithCookies): string | undefined {
    const cookies = request.cookies as unknown;
    if (!cookies || typeof cookies !== 'object') {
      return undefined;
    }

    const value = (cookies as Record<string, unknown>)[REFRESH_COOKIE_NAME];
    return typeof value === 'string' ? value : undefined;
  }

  setRefreshToken(response: Response, token: string): void {
    response.cookie(REFRESH_COOKIE_NAME, token, {
      ...this.baseOptions(),
      maxAge: this.configService.get<number>(
        'REFRESH_COOKIE_MAX_AGE_MS',
        604_800_000,
      ),
    });
  }

  clearRefreshToken(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, this.baseOptions());
  }

  private baseOptions(): CookieOptions {
    const apiPrefix = this.configService.get<string>('API_PREFIX', 'api/v1');
    return {
      httpOnly: true,
      secure:
        this.configService.get<string>('NODE_ENV', 'development') ===
        'production',
      sameSite: 'lax',
      path: `/${apiPrefix}/auth`,
    };
  }
}
