import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  DEFAULT_TIMEZONE,
  getLocalMonthStartKey,
  getLocalMonthUtcRange,
} from '../../common/dates/local-date';
import { PrismaService } from '../../database/prisma/prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

type Currency = 'PEN' | 'USD';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, query: DashboardSummaryDto) {
    const timezone = await this.getUserTimezone(userId);
    const monthStartKey =
      query.monthStart ?? getLocalMonthStartKey(new Date(), timezone);
    const monthRange = getLocalMonthUtcRange(monthStartKey, timezone);
    const budgetMonthStart = new Date(`${monthStartKey}T00:00:00.000Z`);
    const currencyFilter = query.currency;

    const [
      accountRows,
      reservationRows,
      monthTransactions,
      budgets,
      goals,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['currency', 'type'],
        where: {
          userId,
          deletedAt: null,
          currency: currencyFilter,
          balanceImpactStatus: 'AFFECTS_BALANCE',
        },
        _sum: { amount: true },
      }),
      this.prisma.goalReservation.findMany({
        where: {
          userId,
          status: { in: ['ACTIVE', 'INSUFFICIENT'] },
          account: {
            currency: currencyFilter,
          },
        },
        select: {
          amount: true,
          account: { select: { currency: true } },
        },
      }),
      this.prisma.transaction.groupBy({
        by: ['currency', 'type'],
        where: {
          userId,
          deletedAt: null,
          currency: currencyFilter,
          occurredAt: { gte: monthRange.from, lt: monthRange.to },
        },
        _sum: { amount: true },
      }),
      this.prisma.budget.findMany({
        where: {
          userId,
          currency: currencyFilter,
          monthStart: budgetMonthStart,
        },
        select: {
          categoryId: true,
          amount: true,
          currency: true,
        },
      }),
      this.prisma.goal.findMany({
        where: {
          userId,
          deletedAt: null,
          currency: currencyFilter,
          status: { in: ['ACTIVE', 'PAUSED'] },
        },
        include: {
          reservations: {
            where: { status: { in: ['ACTIVE', 'INSUFFICIENT'] } },
            select: { amount: true, status: true },
          },
        },
        orderBy: [{ targetDate: 'asc' }, { name: 'asc' }],
        take: 5,
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: null,
          currency: currencyFilter,
        },
        include: {
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, icon: true } },
        },
        orderBy: { occurredAt: 'desc' },
        take: 5,
      }),
    ]);

    const currencies = getCurrencies(currencyFilter, [
      ...accountRows.map((row) => row.currency as Currency),
      ...monthTransactions.map((row) => row.currency as Currency),
      ...budgets.map((budget) => budget.currency as Currency),
      ...goals.map((goal) => goal.currency as Currency),
    ]);

    return {
      monthStart: monthStartKey,
      currencies: currencies.map((currency) => {
        const realBalance = getRealBalance(accountRows, currency);
        const monthlyIncome = getMonthlyAmount(
          monthTransactions,
          currency,
          'INCOME',
        );
        const monthlyExpense = getMonthlyAmount(
          monthTransactions,
          currency,
          'EXPENSE',
        );
        const budgetPlan = getBudgetPlan(budgets, currency);
        const usedBudget = monthlyExpense;
        const reservedAmount = getReservedAmount(reservationRows, currency);
        const currencyGoals = goals.filter(
          (goal) => goal.currency === currency,
        );

        return {
          currency,
          realBalance: realBalance.toFixed(4),
          reservedAmount: reservedAmount.toFixed(4),
          availableBalance: realBalance.minus(reservedAmount).toFixed(4),
          monthlyIncome: monthlyIncome.toFixed(4),
          monthlyExpense: monthlyExpense.toFixed(4),
          monthlyBalance: monthlyIncome.minus(monthlyExpense).toFixed(4),
          budgetAmount: budgetPlan.toFixed(4),
          budgetUsedAmount: usedBudget.toFixed(4),
          budgetRemainingAmount: budgetPlan.minus(usedBudget).toFixed(4),
          goals: currencyGoals.map((goal) => {
            const reserved = goal.reservations.reduce(
              (total, reservation) => total.plus(reservation.amount),
              new Prisma.Decimal(0),
            );
            return {
              id: goal.id,
              name: goal.name,
              targetAmount: goal.targetAmount.toFixed(4),
              reservedAmount: reserved.toFixed(4),
              progressPercent: reserved
                .dividedBy(goal.targetAmount)
                .times(100)
                .toFixed(2),
            };
          }),
        };
      }),
      recentTransactions: recentTransactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount.toFixed(4),
        currency: transaction.currency,
        description: transaction.description,
        occurredAt: transaction.occurredAt,
        balanceImpactStatus: transaction.balanceImpactStatus,
        account: transaction.account,
        category: transaction.category,
      })),
    };
  }

  private async getUserTimezone(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { timezone: true },
    });

    return profile?.timezone ?? DEFAULT_TIMEZONE;
  }
}

function getCurrencies(
  currencyFilter: Currency | undefined,
  observed: Currency[],
) {
  if (currencyFilter) {
    return [currencyFilter];
  }
  const unique = Array.from(new Set(observed));
  return unique.length > 0 ? unique.sort() : [];
}

function getRealBalance(
  rows: Array<{
    currency: string;
    type: string;
    _sum: { amount: Prisma.Decimal | null };
  }>,
  currency: Currency,
) {
  return rows
    .filter((row) => row.currency === currency)
    .reduce((total, row) => {
      const amount = row._sum.amount ?? new Prisma.Decimal(0);
      return isNegativeBalanceType(row.type)
        ? total.minus(amount)
        : total.plus(amount);
    }, new Prisma.Decimal(0));
}

function isNegativeBalanceType(type: string) {
  return type === 'EXPENSE' || type === 'TRANSFER_OUT';
}

function getMonthlyAmount(
  rows: Array<{
    currency: string;
    type: string;
    _sum: { amount: Prisma.Decimal | null };
  }>,
  currency: Currency,
  type: 'INCOME' | 'EXPENSE',
) {
  return rows
    .filter((row) => row.currency === currency && row.type === type)
    .reduce(
      (total, row) => total.plus(row._sum.amount ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );
}

function getBudgetPlan(
  budgets: Array<{
    categoryId: string | null;
    amount: Prisma.Decimal;
    currency: string;
  }>,
  currency: Currency,
) {
  const currencyBudgets = budgets.filter(
    (budget) => budget.currency === currency,
  );
  const general = currencyBudgets.find((budget) => budget.categoryId === null);
  if (general) {
    return general.amount;
  }
  return currencyBudgets.reduce(
    (total, budget) => total.plus(budget.amount),
    new Prisma.Decimal(0),
  );
}

function getReservedAmount(
  rows: Array<{
    amount: Prisma.Decimal;
    account: { currency: string };
  }>,
  currency: Currency,
) {
  return rows
    .filter((row) => row.account.currency === currency)
    .reduce((total, row) => total.plus(row.amount), new Prisma.Decimal(0));
}
