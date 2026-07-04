import {
  buildLocalMonthDateKeys,
  getLocalMonthUtcRange,
  toLocalDateKey,
} from './local-date';

describe('local date helpers', () => {
  it('keeps a late Lima movement on the registered local day', () => {
    const value = new Date('2026-06-29T02:18:00.000Z');

    expect(toLocalDateKey(value, 'America/Lima')).toBe('2026-06-28');
  });

  it('builds the UTC range for a local month', () => {
    const range = getLocalMonthUtcRange('2026-06-01', 'America/Lima');

    expect(range.from.toISOString()).toBe('2026-06-01T05:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-07-01T05:00:00.000Z');
  });

  it('lists every local date key in a month', () => {
    const days = buildLocalMonthDateKeys('2026-02-01');

    expect(days).toHaveLength(28);
    expect(days[0]).toBe('2026-02-01');
    expect(days[27]).toBe('2026-02-28');
  });
});
