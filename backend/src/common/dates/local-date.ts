export const DEFAULT_TIMEZONE = 'America/Lima';

type LocalDateParts = {
  year: number;
  month: number;
  day: number;
};

const localDateFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function toLocalDateKey(
  value: Date,
  timezone = DEFAULT_TIMEZONE,
): string {
  const parts = getLocalDateParts(value, timezone);
  return formatDateKey(parts.year, parts.month, parts.day);
}

export function getLocalMonthStartKey(
  value: Date,
  timezone = DEFAULT_TIMEZONE,
): string {
  const parts = getLocalDateParts(value, timezone);
  return formatDateKey(parts.year, parts.month, 1);
}

export function getLocalMonthUtcRange(
  monthStartKey: string,
  timezone = DEFAULT_TIMEZONE,
) {
  const from = localDateKeyToUtcDate(monthStartKey, timezone);
  const to = localDateKeyToUtcDate(
    addMonthsToDateKey(monthStartKey, 1),
    timezone,
  );

  return { from, to };
}

export function buildLocalMonthDateKeys(monthStartKey: string): string[] {
  const nextMonthStartKey = addMonthsToDateKey(monthStartKey, 1);
  const days: string[] = [];

  for (
    let current = monthStartKey;
    current < nextMonthStartKey;
    current = addDaysToDateKey(current, 1)
  ) {
    days.push(current);
  }

  return days;
}

export function addMonthsToDateKey(dateKey: string, months: number): string {
  const { year, month } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));

  return formatDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

export function localDateKeyToUtcDate(
  dateKey: string,
  timezone = DEFAULT_TIMEZONE,
): Date {
  const { year, month, day } = parseDateKey(dateKey);
  let utcTime = Date.UTC(year, month - 1, day);

  for (let index = 0; index < 2; index += 1) {
    const offset = getTimeZoneOffsetMs(new Date(utcTime), timezone);
    utcTime = Date.UTC(year, month - 1, day) - offset;
  }

  return new Date(utcTime);
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const { year, month, day } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return formatDateKey(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

function getLocalDateParts(value: Date, timezone: string): LocalDateParts {
  const parts = getFormatter(timezone).formatToParts(value);
  const partValue = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((item) => item.type === type);
    return part ? Number(part.value) : NaN;
  };

  return {
    year: partValue('year'),
    month: partValue('month'),
    day: partValue('day'),
  };
}

function getTimeZoneOffsetMs(value: Date, timezone: string): number {
  const parts = getLocalDateTimeParts(value, timezone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return localAsUtc - value.getTime();
}

function getLocalDateTimeParts(value: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(value);
  const partValue = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((item) => item.type === type);
    return part ? Number(part.value) : NaN;
  };

  return {
    year: partValue('year'),
    month: partValue('month'),
    day: partValue('day'),
    hour: partValue('hour'),
    minute: partValue('minute'),
    second: partValue('second'),
  };
}

function getFormatter(timezone: string) {
  const cached = localDateFormatterCache.get(timezone);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  localDateFormatterCache.set(timezone, formatter);
  return formatter;
}

function parseDateKey(dateKey: string): LocalDateParts {
  const [year, month, day] = dateKey.split('-').map(Number);

  return { year, month, day };
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
