import { es } from '../../i18n/es';

type BalanceImpactStatus =
  | 'AFFECTS_BALANCE'
  | 'ANALYSIS_ONLY'
  | 'PENDING_FUTURE';

type BalanceImpactBadgeProps = {
  status: BalanceImpactStatus;
};

export function BalanceImpactBadge({ status }: BalanceImpactBadgeProps) {
  const tone = {
    AFFECTS_BALANCE:
      'border-emerald-200 bg-emerald-50 text-emerald-800',
    ANALYSIS_ONLY: 'border-amber-200 bg-amber-50 text-amber-800',
    PENDING_FUTURE: 'border-slate-200 bg-slate-100 text-slate-700',
  }[status];

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}
      title={es.transactions.balanceImpactHelp[status]}
    >
      {es.transactions.balanceImpactStatus[status]}
    </span>
  );
}
