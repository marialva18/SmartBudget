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
      }),
    ).toThrow('DATABASE_URL must be configured for production.');
  });

  it('accepts local development defaults', () => {
    expect(validateEnvironment({ NODE_ENV: 'development' })).toEqual(
      expect.objectContaining({
        API_PREFIX: 'api/v1',
        FRONTEND_ORIGIN: 'http://localhost:5173',
        TRUST_PROXY: false,
      }),
    );
  });
});
