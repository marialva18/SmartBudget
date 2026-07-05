import { getBalanceImpactStatus } from './balance-impact';

describe('getBalanceImpactStatus', () => {
  const now = new Date('2026-07-05T16:00:00.000Z');

  it('marks local movements before balance control as analysis only', () => {
    const status = getBalanceImpactStatus({
      balanceStartedAt: new Date('2026-07-01T05:00:00.000Z'),
      occurredAt: new Date('2026-07-01T04:59:00.000Z'),
      now,
      timezone: 'America/Lima',
    });

    expect(status).toBe('ANALYSIS_ONLY');
  });

  it('marks movements on the local balance start day as affecting balance', () => {
    const status = getBalanceImpactStatus({
      balanceStartedAt: new Date('2026-07-01T05:00:00.000Z'),
      occurredAt: new Date('2026-07-01T18:00:00.000Z'),
      now,
      timezone: 'America/Lima',
    });

    expect(status).toBe('AFFECTS_BALANCE');
  });

  it('marks future local movements as pending', () => {
    const status = getBalanceImpactStatus({
      balanceStartedAt: new Date('2026-07-01T05:00:00.000Z'),
      occurredAt: new Date('2026-07-06T05:00:00.000Z'),
      now,
      timezone: 'America/Lima',
    });

    expect(status).toBe('PENDING_FUTURE');
  });
});
