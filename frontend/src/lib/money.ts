export type CurrencyCode = 'PEN' | 'USD';

const currencyFormatters = new Map<CurrencyCode, Intl.NumberFormat>();

export function formatMoney(value: number, currency: CurrencyCode) {
  let formatter = currencyFormatters.get(currency);

  if (!formatter) {
    formatter = new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(currency, formatter);
  }

  return formatter.format(value).replace(/\u00A0/g, ' ');
}

export function formatSignedMoney(
  value: number,
  currency: CurrencyCode,
  sign: '+' | '-',
) {
  return `${sign} ${formatMoney(Math.abs(value), currency)}`;
}
