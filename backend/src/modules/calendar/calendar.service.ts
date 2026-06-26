import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CalendarMonthDto } from './dto/calendar-month.dto';

type CalendarTransaction = {
  id: string;
  type: string;
  amount: Prisma.Decimal;
  currency: string;
  description: string | null;
  occurredAt: Date;
  source: string;
  account: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
};

type CalendarDayBucket = {
  date: string;
  incomeTotal: Prisma.Decimal;
  expenseTotal: Prisma.Decimal;
  netTotal: Prisma.Decimal;
  transactions: CalendarTransaction[];
};

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async month(userId: string, query: CalendarMonthDto) {
    const monthStart = parseMonthStart(query.monthStart);
    const nextMonthStart = addMonths(monthStart, 1);

    if (query.accountId) {
      await this.ensureAccountBelongsToUser(userId, query.accountId);
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        type: { in: ['INCOME', 'EXPENSE'] },
        currency: query.currency,
        accountId: query.accountId,
        occurredAt: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
    });

    const days = buildMonthDays(monthStart);
    const buckets = new Map<string, CalendarDayBucket>();

    for (const day of days) {
      buckets.set(day, {
        date: day,
        incomeTotal: new Prisma.Decimal(0),
        expenseTotal: new Prisma.Decimal(0),
        netTotal: new Prisma.Decimal(0),
        transactions: [],
      });
    }

    for (const transaction of transactions) {
      const dayKey = toDateKey(transaction.occurredAt);
      const bucket = buckets.get(dayKey);

      if (!bucket) {
        continue;
      }

      if (transaction.type === 'INCOME') {
        bucket.incomeTotal = bucket.incomeTotal.plus(transaction.amount);
        bucket.netTotal = bucket.netTotal.plus(transaction.amount);
      }

      if (transaction.type === 'EXPENSE') {
        bucket.expenseTotal = bucket.expenseTotal.plus(transaction.amount);
        bucket.netTotal = bucket.netTotal.minus(transaction.amount);
      }

      bucket.transactions.push(transaction);
    }

    const responseDays = Array.from(buckets.values()).map((day) => ({
      date: day.date,
      incomeTotal: day.incomeTotal.toFixed(4),
      expenseTotal: day.expenseTotal.toFixed(4),
      netTotal: day.netTotal.toFixed(4),
      transactions: day.transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount.toFixed(4),
        currency: transaction.currency,
        description: transaction.description,
        occurredAt: transaction.occurredAt,
        source: transaction.source,
        account: transaction.account,
        category: transaction.category,
      })),
    }));

    return {
      monthStart: formatMonthStart(monthStart),
      days: responseDays,
    };
  }

  private async ensureAccountBelongsToUser(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!account) {
      throw new ForbiddenException('No puedes consultar esta cuenta.');
    }
  }
}

function parseMonthStart(value?: string) {
  if (!value) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function addMonths(date: Date, months: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
}

function buildMonthDays(monthStart: Date) {
  const nextMonthStart = addMonths(monthStart, 1);
  const days: string[] = [];

  for (
    let current = new Date(monthStart);
    current < nextMonthStart;
    current = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + 1),
    )
  ) {
    days.push(toDateKey(current));
  }

  return days;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatMonthStart(date: Date) {
  return date.toISOString().slice(0, 10);
}