type Environment = Record<string, unknown>;

const REQUIRED_PRODUCTION_VALUES = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
] as const;

export function validateEnvironment(config: Environment): Environment {
  const nodeEnv = readString(config.NODE_ENV, 'development');

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test or production.');
  }

  if (nodeEnv === 'production') {
    for (const key of REQUIRED_PRODUCTION_VALUES) {
      const value = readString(config[key]);
      if (!value || value.includes('replace_') || value.includes('change_me')) {
        throw new Error(`${key} must be configured for production.`);
      }
    }

    const accessSecret = readString(config.JWT_ACCESS_SECRET);
    if (accessSecret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters.');
    }
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: Number(config.PORT ?? 3000),
    API_PREFIX: normalizeApiPrefix(readString(config.API_PREFIX, '/api/v1')),
    FRONTEND_ORIGIN: readString(
      config.FRONTEND_ORIGIN,
      'http://localhost:5173',
    ),
    TRUST_PROXY: readString(config.TRUST_PROXY, 'false') === 'true',
    REFRESH_COOKIE_MAX_AGE_MS: Number(
      config.REFRESH_COOKIE_MAX_AGE_MS ?? 604_800_000,
    ),
  };
}

export function normalizeApiPrefix(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  return trimmed || 'api/v1';
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
