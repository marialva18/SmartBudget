/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { BudgetsService } from './budgets.service';

describe('BudgetsService', () => {
  const prisma = {
    budget: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    transaction: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const transactionClient = {
    budget: {
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };
  let service: BudgetsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BudgetsService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );
  });

  it('lists monthly budgets with spent and remaining amounts', async () => {
    prisma.budget.findMany.mockResolvedValue([
      budgetRecord(),
      budgetRecord({
        id: 'category-budget-id',
        categoryId: 'category-id',
        amount: new Prisma.Decimal(200),
        category: categoryRecord(),
      }),
    ]);
    prisma.transaction.groupBy.mockResolvedValue([
      {
        currency: 'PEN',
        categoryId: 'category-id',
        _sum: { amount: new Prisma.Decimal(50) },
      },
      {
        currency: 'PEN',
        categoryId: 'other-category-id',
        _sum: { amount: new Prisma.Decimal(25) },
      },
    ]);

    const result = await service.findAll('user-id', {
      currency: 'PEN',
      monthStart: '2026-06-01',
    });

    expect(prisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-id',
          currency: 'PEN',
          monthStart: new Date('2026-06-01T00:00:00.000Z'),
        },
      }),
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        amount: '500.0000',
        spentAmount: '75.0000',
        remainingAmount: '425.0000',
        exceeded: false,
      }),
    );
    expect(result.items[1]).toEqual(
      expect.objectContaining({
        spentAmount: '50.0000',
        remainingAmount: '150.0000',
      }),
    );
  });

  it('creates and audits a general budget', async () => {
    transactionClient.budget.create.mockResolvedValue(budgetRecord());
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.create('user-id', 'WEB', {
      amount: 500,
      currency: 'PEN',
      monthStart: '2026-06-01',
    });

    expect(transactionClient.budget.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        categoryId: undefined,
        amount: new Prisma.Decimal(500),
        currency: 'PEN',
        monthStart: new Date('2026-06-01T00:00:00.000Z'),
      },
      include: expect.any(Object),
    });
    expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'BUDGET_CREATED',
        entity: 'BUDGET',
        channel: 'WEB',
      }),
    });
    expect(result.amount).toBe('500.0000');
  });

  it('requires an active expense category when categoryId is provided', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user-id', 'WEB', {
        amount: 120,
        currency: 'PEN',
        monthStart: '2026-06-01',
        categoryId: 'category-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps duplicate month and category budgets to a conflict', async () => {
    transactionClient.budget.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.create('user-id', 'WEB', {
        amount: 500,
        currency: 'PEN',
        monthStart: '2026-06-01',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not update another user budget', async () => {
    prisma.budget.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-id', 'budget-id', 'WEB', { amount: 600 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates amount and keeps spent amount derived from movements', async () => {
    prisma.budget.findFirst.mockResolvedValue(budgetRecord());
    transactionClient.budget.update.mockResolvedValue(
      budgetRecord({ amount: new Prisma.Decimal(700) }),
    );
    transactionClient.auditLog.create.mockResolvedValue({});
    prisma.transaction.aggregate.mockResolvedValue({
      _sum: { amount: new Prisma.Decimal(90) },
    });

    const result = await service.update('user-id', 'budget-id', 'MOBILE', {
      amount: 700,
    });

    expect(transactionClient.budget.update).toHaveBeenCalledWith({
      where: { id: 'budget-id' },
      data: { amount: new Prisma.Decimal(700) },
      include: expect.any(Object),
    });
    expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'BUDGET_UPDATED',
        channel: 'MOBILE',
      }),
    });
    expect(result.spentAmount).toBe('90.0000');
  });
});

function budgetRecord(
  overrides: Partial<ReturnType<typeof budgetRecordBase>> = {},
) {
  return { ...budgetRecordBase(), ...overrides };
}

function budgetRecordBase() {
  return {
    id: 'budget-id',
    userId: 'user-id',
    categoryId: null as string | null,
    category: null as ReturnType<typeof categoryRecord> | null,
    amount: new Prisma.Decimal(500),
    currency: 'PEN',
    monthStart: new Date('2026-06-01T00:00:00.000Z'),
    createdAt: new Date('2026-06-25T18:00:00.000Z'),
    updatedAt: new Date('2026-06-25T18:00:00.000Z'),
  };
}

function categoryRecord() {
  return {
    id: 'category-id',
    name: 'Alimentacion',
    icon: 'utensils',
    type: 'EXPENSE',
  };
}
