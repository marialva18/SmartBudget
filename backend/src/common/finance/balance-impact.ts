import {
  DEFAULT_TIMEZONE,
  toLocalDateKey,
} from '../dates/local-date';

export type BalanceImpactStatus =
  | 'AFFECTS_BALANCE'
  | 'ANALYSIS_ONLY'
  | 'PENDING_FUTURE';

type BalanceImpactInput = {
  occurredAt: Date;
  balanceStartedAt: Date;
  timezone?: string;
  now?: Date;
};

export function getBalanceImpactStatus({
  balanceStartedAt,
  now = new Date(),
  occurredAt,
  timezone = DEFAULT_TIMEZONE,
}: BalanceImpactInput): BalanceImpactStatus {
  const occurredDateKey = toLocalDateKey(occurredAt, timezone);
  const balanceStartedDateKey = toLocalDateKey(balanceStartedAt, timezone);
  const todayDateKey = toLocalDateKey(now, timezone);

  if (occurredDateKey > todayDateKey) {
    return 'PENDING_FUTURE';
  }

  if (occurredDateKey < balanceStartedDateKey) {
    return 'ANALYSIS_ONLY';
  }

  return 'AFFECTS_BALANCE';
}
