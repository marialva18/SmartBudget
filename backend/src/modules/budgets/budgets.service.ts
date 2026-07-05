import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  DEFAULT_TIMEZONE,
  getLocalMonthStartKey,
  getLocalMonthUtcRange,
} from '../../common/dates/local-date';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { ListBudgetsDto } from './dto/list-budgets.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

type Channel = 'WEB' | 'MOBILE';

const budgetInclude = {
  category: { select: { id: true, name: true, icon: true, type: true } },
} satisfies Prisma.BudgetInclude;

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListBudgetsDto) {
    const timezone = await this.getUserTimezone(userId);
    const monthStartKey =
      query.monthStart ?? getLocalMonthStartKey(new Date(), timezone);
    const monthStart = parseMonthStart(monthStartKey);
    const monthRange = getLocalMonthUtcRange(monthStartKey, timezone);

    const [budgets, expenseRows] = await Promise.all([
      this.prisma.budget.findMany({
        where: {
          userId,
          currency: query.currency,
          monthStart,
        },
        include: budgetInclude,
        orderBy: [{ categoryId: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.transaction.groupBy({
        by: ['currency', 'categoryId'],
        where: {
          userId,
          deletedAt: null,
          type: 'EXPENSE',
          currency: query.currency,
          balanceImpactStatus: 'AFFECTS_BALANCE',
          occurredAt: {
            gte: monthRange.from,
            lt: monthRange.to,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const spentByKey = new Map<string, Prisma.Decimal>();
    const totalSpentByCurrency = new Map<string, Prisma.Decimal>();
    for (const row of expenseRows) {
      const amount = row._sum.amount ?? new Prisma.Decimal(0);
      spentByKey.set(spentKey(row.currency, row.categoryId), amount);
      totalSpentByCurrency.set(
        row.currency,
        (totalSpentByCurrency.get(row.currency) ?? new Prisma.Decimal(0)).plus(
          amount,
        ),
      );
    }

    const items = budgets.map((budget) => {
      const spentAmount = budget.categoryId
        ? spentByKey.get(spentKey(budget.currency, budget.categoryId))
        : totalSpentByCurrency.get(budget.currency);
      return this.toResponse(budget, spentAmount ?? new Prisma.Decimal(0));
    });

    return {
      monthStart: monthStartKey,
      items,
    };
  }

  async create(userId: string, channel: Channel, dto: CreateBudgetDto) {
    const monthStart = parseMonthStart(dto.monthStart);
    await this.validateCategory(userId, dto.categoryId);

    try {
      const budget = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.budget.create({
          data: {
            userId,
            categoryId: dto.categoryId,
            amount: new Prisma.Decimal(dto.amount),
            currency: dto.currency,
            monthStart,
          },
          include: budgetInclude,
        });
        await transaction.auditLog.create({
          data: {
            userId,
            action: 'BUDGET_CREATED',
            entity: 'BUDGET',
            entityId: created.id,
            channel,
            newValuesJson: JSON.stringify(this.auditValues(created)),
          },
        });
        return created;
      });
      return this.toResponse(budget, new Prisma.Decimal(0));
    } catch (error) {
      this.handleUniqueConflict(error);
    }
  }

  async update(
    userId: string,
    budgetId: string,
    channel: Channel,
    dto: UpdateBudgetDto,
  ) {
    const current = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: budgetInclude,
    });
    if (!current) {
      throw new NotFoundException(es.budgets.missing);
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const budget = await transaction.budget.update({
        where: { id: current.id },
        data: {
          amount: new Prisma.Decimal(dto.amount),
        },
        include: budgetInclude,
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'BUDGET_UPDATED',
          entity: 'BUDGET',
          entityId: budget.id,
          channel,
          oldValuesJson: JSON.stringify(this.auditValues(current)),
          newValuesJson: JSON.stringify(this.auditValues(budget)),
        },
      });
      return budget;
    });

    const spentAmount = await this.getSpentAmount(
      userId,
      updated.currency,
      updated.monthStart,
      updated.categoryId,
    );
    return this.toResponse(updated, spentAmount);
  }

  private async validateCategory(userId: string, categoryId?: string) {
    if (!categoryId) {
      return;
    }
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        type: 'EXPENSE',
        status: 'ACTIVE',
        OR: [{ isSystem: true }, { userId }],
      },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException(es.budgets.invalidCategory);
    }
  }

  private async getSpentAmount(
    userId: string,
    currency: string,
    monthStart: Date,
    categoryId: string | null,
  ) {
    const timezone = await this.getUserTimezone(userId);
    const monthStartKey = formatMonthStart(monthStart);
    const monthRange = getLocalMonthUtcRange(monthStartKey, timezone);
    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        deletedAt: null,
        type: 'EXPENSE',
        currency,
        categoryId: categoryId ?? undefined,
        balanceImpactStatus: 'AFFECTS_BALANCE',
        occurredAt: {
          gte: monthRange.from,
          lt: monthRange.to,
        },
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  private async getUserTimezone(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { timezone: true },
    });

    return profile?.timezone ?? DEFAULT_TIMEZONE;
  }

  private toResponse(
    budget: Prisma.BudgetGetPayload<{ include: typeof budgetInclude }>,
    spentAmount: Prisma.Decimal,
  ) {
    const remainingAmount = budget.amount.minus(spentAmount);
    const usagePercent = budget.amount.equals(0)
      ? new Prisma.Decimal(0)
      : spentAmount.dividedBy(budget.amount).times(100);
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      category: budget.category,
      amount: budget.amount.toFixed(4),
      spentAmount: spentAmount.toFixed(4),
      remainingAmount: remainingAmount.toFixed(4),
      usagePercent: usagePercent.toFixed(2),
      exceeded: remainingAmount.lessThan(0),
      currency: budget.currency,
      monthStart: formatMonthStart(budget.monthStart),
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }

  private handleUniqueConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(es.budgets.duplicate);
    }
    throw error;
  }

  private auditValues(
    budget: Prisma.BudgetGetPayload<{ include: typeof budgetInclude }>,
  ) {
    return {
      categoryId: budget.categoryId,
      amount: budget.amount.toFixed(4),
      currency: budget.currency,
      monthStart: formatMonthStart(budget.monthStart),
    };
  }
}

function parseMonthStart(value?: string) {
  if (!value) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return new Date(`${value}T00:00:00.000Z`);
}

function formatMonthStart(date: Date) {
  return date.toISOString().slice(0, 10);
}

function spentKey(currency: string, categoryId: string | null) {
  return `${currency}:${categoryId ?? 'GENERAL'}`;
}
