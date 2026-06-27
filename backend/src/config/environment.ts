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

  const emailProvider = readString(config.EMAIL_PROVIDER);
  if (emailProvider && emailProvider !== 'resend') {
    throw new Error('EMAIL_PROVIDER must be empty or resend.');
  }

  if (emailProvider === 'resend') {
    for (const key of [
      'RESEND_API_KEY',
      'EMAIL_FROM',
      'PASSWORD_RESET_APP_URL',
    ]) {
      if (!readString(config[key])) {
        throw new Error(
          `${key} must be configured when EMAIL_PROVIDER=resend.`,
        );
      }
    }
  }

  const aiCoachEnabled = readBoolean(config.AI_COACH_ENABLED, false);
  const geminiApiKey = readString(config.GEMINI_API_KEY);
  const geminiModel = readString(
    config.GEMINI_MODEL,
    'gemini-3-flash-preview',
  );
  const aiCoachDailyLimit = readPositiveInteger(
    config.AI_COACH_DAILY_LIMIT,
    20,
  );

  if (aiCoachEnabled && !geminiApiKey) {
    throw new Error('GEMINI_API_KEY must be configured when AI_COACH_ENABLED=true.');
  }

  if (aiCoachDailyLimit < 1 || aiCoachDailyLimit > 100) {
    throw new Error('AI_COACH_DAILY_LIMIT must be between 1 and 100.');
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
    TRUST_PROXY: readBoolean(config.TRUST_PROXY, false),
    REFRESH_COOKIE_MAX_AGE_MS: Number(
      config.REFRESH_COOKIE_MAX_AGE_MS ?? 604_800_000,
    ),
    AI_COACH_ENABLED: aiCoachEnabled,
    GEMINI_API_KEY: geminiApiKey,
    GEMINI_MODEL: geminiModel,
    AI_COACH_DAILY_LIMIT: aiCoachDailyLimit,
  };
}

export function normalizeApiPrefix(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  return trimmed || 'api/v1';
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

function readPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}