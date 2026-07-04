/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const prisma = {
    transaction: {
      groupBy: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
    },
    groupExpense: {
      findMany: jest.fn(),
    },
  };

  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService(prisma as unknown as PrismaService);
  });

  it('summarizes income, expenses and balance', async () => {
    prisma.transaction.groupBy.mockResolvedValue([
      {
        currency: 'PEN',
        type: 'INCOME',
        _sum: { amount: new Prisma.Decimal(100) },
        _count: { _all: 1 },
      },
      {
        currency: 'PEN',
        type: 'EXPENSE',
        _sum: { amount: new Prisma.Decimal(40) },
        _count: { _all: 2 },
      },
    ]);
    prisma.transaction.findFirst.mockResolvedValue(null);
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 'expense-id',
        type: 'EXPENSE',
        amount: new Prisma.Decimal(40),
        currency: 'PEN',
        description: 'Mercado',
        occurredAt: new Date('2026-07-04T15:00:00.000Z'),
        balanceImpactStatus: 'AFFECTS_BALANCE',
        account: { id: 'account-id', name: 'Efectivo' },
        category: { id: 'category-id', name: 'Comida', icon: null },
      },
    ]);
    prisma.profile.findUnique.mockResolvedValue({ timezone: 'America/Lima' });
    prisma.budget.findMany.mockResolvedValue([]);

    const result = await service.summary('user-id', { currency: 'PEN' });

    expect(result.totals).toEqual({
      income: '100.0000',
      expense: '40.0000',
    });
    expect(result.balance).toBe('60.0000');
    expect(result.movementCount).toBe(3);
    expect(prisma.transaction.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-id',
          currency: 'PEN',
          type: { in: ['INCOME', 'EXPENSE'] },
        }),
      }),
    );
  });

  it('exports analytics as an xlsx workbook', async () => {
    prisma.transaction.groupBy.mockImplementation((args) => {
      if (args.by.includes('categoryId')) {
        return Promise.resolve([
          {
            categoryId: 'category-id',
            currency: 'PEN',
            _sum: { amount: new Prisma.Decimal(40) },
            _count: { _all: 1 },
          },
        ]);
      }

      if (args.by.includes('accountId')) {
        return Promise.resolve([
          {
            accountId: 'account-id',
            currency: 'PEN',
            type: 'EXPENSE',
            _sum: { amount: new Prisma.Decimal(40) },
            _count: { _all: 1 },
          },
        ]);
      }

      return Promise.resolve([
        {
          currency: 'PEN',
          type: 'EXPENSE',
          _sum: { amount: new Prisma.Decimal(40) },
          _count: { _all: 1 },
        },
      ]);
    });
    prisma.transaction.findFirst.mockResolvedValue(null);
    prisma.transaction.findMany.mockImplementation((args) => {
      if (args.select) {
        return Promise.resolve([
          {
            type: 'EXPENSE',
            amount: new Prisma.Decimal(40),
            currency: 'PEN',
            occurredAt: new Date('2026-07-04T15:00:00.000Z'),
          },
        ]);
      }

      return Promise.resolve([
        {
          id: 'expense-id',
          type: 'EXPENSE',
          amount: new Prisma.Decimal(40),
          currency: 'PEN',
          description: 'Mercado',
          occurredAt: new Date('2026-07-04T15:00:00.000Z'),
          balanceImpactStatus: 'AFFECTS_BALANCE',
          account: { id: 'account-id', name: 'Efectivo' },
          category: { id: 'category-id', name: 'Comida', icon: null },
        },
      ]);
    });
    prisma.category.findMany.mockResolvedValue([
      { id: 'category-id', name: 'Comida', icon: null },
    ]);
    prisma.account.findMany.mockResolvedValue([
      { id: 'account-id', name: 'Efectivo', currency: 'PEN' },
    ]);
    prisma.profile.findUnique.mockResolvedValue({ timezone: 'America/Lima' });
    prisma.budget.findMany.mockResolvedValue([]);
    prisma.groupExpense.findMany.mockResolvedValue([]);

    const result = await service.exportWorkbook('user-id', {
      currency: 'PEN',
    });

    expect(result.filename).toMatch(/^qori-analytics-\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.subarray(0, 2).toString()).toBe('PK');
  });
});
