import { normalizeApiPrefix, validateEnvironment } from './environment';

describe('environment configuration', () => {
  it('normalizes the API prefix', () => {
    expect(normalizeApiPrefix('/api/v1/')).toBe('api/v1');
  });

  it('rejects placeholder secrets in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'change_me',
        JWT_ACCESS_SECRET: 'replace_with_a_secret',
        FRONTEND_ORIGIN: 'https://qori.example.com',
        TRUST_PROXY: 'true',
        EMAIL_PROVIDER: 'smtp',
      }),
    ).toThrow('DATABASE_URL must be configured for production.');
  });

  it('requires TRUST_PROXY in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'sqlserver://prod.example.com:1433;database=Qori',
        JWT_ACCESS_SECRET: 'a'.repeat(32),
        FRONTEND_ORIGIN: 'https://qori.example.com',
        EMAIL_PROVIDER: 'smtp',
      }),
    ).toThrow('TRUST_PROXY must be true in production.');
  });

  it('rejects localhost frontend origins in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'sqlserver://prod.example.com:1433;database=Qori',
        JWT_ACCESS_SECRET: 'a'.repeat(32),
        FRONTEND_ORIGIN: 'http://localhost:5173',
        TRUST_PROXY: 'true',
        EMAIL_PROVIDER: 'smtp',
      }),
    ).toThrow('FRONTEND_ORIGIN must use the production frontend URL.');
  });

  it('accepts local development defaults', () => {
    expect(validateEnvironment({ NODE_ENV: 'development' })).toEqual(
      expect.objectContaining({
        API_PREFIX: 'api/v1',
        EMAIL_VERIFICATION_EXPIRES_IN_MINUTES: 60,
        FRONTEND_ORIGIN: 'http://localhost:5173',
        TRUST_PROXY: false,
        THROTTLE_TTL_MS: 60_000,
        THROTTLE_LIMIT: 100,
      }),
    );
  });

  it('normalizes throttle settings from environment variables', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'development',
        THROTTLE_TTL_MS: '30000',
        THROTTLE_LIMIT: '50',
      }),
    ).toEqual(
      expect.objectContaining({
        THROTTLE_TTL_MS: 30_000,
        THROTTLE_LIMIT: 50,
      }),
    );
  });

  it('rejects unsupported email providers', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        EMAIL_PROVIDER: 'mailgun',
      }),
    ).toThrow('EMAIL_PROVIDER must be empty, mailjet, resend or smtp.');
  });

  it('requires email settings when Mailjet is enabled', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        EMAIL_PROVIDER: 'mailjet',
        MAILJET_API_KEY: 'key',
      }),
    ).toThrow(
      'MAILJET_SECRET_KEY must be configured when EMAIL_PROVIDER=mailjet.',
    );
  });

  it('requires email settings when Resend is enabled', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 'secret',
      }),
    ).toThrow('EMAIL_FROM must be configured when EMAIL_PROVIDER=resend.');
  });

  it('requires an email provider in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'sqlserver://prod.example.com:1433;database=Qori',
        JWT_ACCESS_SECRET: 'a'.repeat(32),
        FRONTEND_ORIGIN: 'https://qori.example.com',
        TRUST_PROXY: 'true',
      }),
    ).toThrow('EMAIL_PROVIDER must be configured in production.');
  });
});
