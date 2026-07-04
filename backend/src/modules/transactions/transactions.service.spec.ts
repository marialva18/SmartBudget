/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  const prisma = {
    account: { findFirst: jest.fn() },
    category: { findFirst: jest.fn() },
    transaction: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const transactionClient = {
    transaction: { create: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  };

  let service: TransactionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TransactionsService(prisma as unknown as PrismaService);
  });

  it('derives currency from the owned active account', async () => {
    prisma.account.findFirst.mockResolvedValue({
      id: 'account-id',
      currency: 'PEN',
      balanceStartedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
    prisma.category.findFirst.mockResolvedValue({ id: 'category-id' });
    const movement = {
      id: 'transaction-id',
      userId: 'user-id',
      accountId: 'account-id',
      categoryId: 'category-id',
      type: 'EXPENSE',
      amount: new Prisma.Decimal(25),
      currency: 'PEN',
      description: 'Almuerzo',
      occurredAt: new Date(),
      source: 'MANUAL_WEB',
      idempotencyKey: 'key',
      balanceImpactStatus: 'AFFECTS_BALANCE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      account: { id: 'account-id', name: 'Efectivo' },
      category: { id: 'category-id', name: 'Alimentación', icon: null },
    };
    transactionClient.transaction.create.mockResolvedValue(movement);
    transactionClient.auditLog.create.mockResolvedValue({});
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );

    const result = await service.create('user-id', 'WEB', 'key', {
      type: 'EXPENSE',
      amount: 25,
      accountId: 'account-id',
      categoryId: 'category-id',
      occurredAt: new Date(),
      description: 'Almuerzo',
    });

    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'account-id',
        userId: 'user-id',
        status: 'ACTIVE',
      },
      select: { id: true, currency: true, balanceStartedAt: true },
    });
    expect(transactionClient.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-id',
        currency: 'PEN',
        balanceImpactStatus: 'AFFECTS_BALANCE',
        source: 'MANUAL_WEB',
      }),
      include: expect.any(Object),
    });
    expect(result.currency).toBe('PEN');
  });

  it('rejects an account that is unavailable to the user', async () => {
    prisma.account.findFirst.mockResolvedValue(null);
    prisma.category.findFirst.mockResolvedValue({ id: 'category-id' });

    await expect(
      service.create('user-id', 'WEB', 'key', {
        type: 'EXPENSE',
        amount: 25,
        accountId: 'other-account',
        categoryId: 'category-id',
        occurredAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a category that does not match the movement type', async () => {
    prisma.account.findFirst.mockResolvedValue({
      id: 'account-id',
      currency: 'PEN',
      balanceStartedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user-id', 'WEB', 'key', {
        type: 'INCOME',
        amount: 100,
        accountId: 'account-id',
        categoryId: 'expense-category',
        occurredAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps movements before balance control as analysis only', async () => {
    prisma.account.findFirst.mockResolvedValue({
      id: 'account-id',
      currency: 'PEN',
      balanceStartedAt: new Date('2026-06-10T00:00:00.000Z'),
    });
    prisma.category.findFirst.mockResolvedValue({ id: 'category-id' });
    const movement = {
      id: 'transaction-id',
      userId: 'user-id',
      accountId: 'account-id',
      categoryId: 'category-id',
      type: 'EXPENSE',
      amount: new Prisma.Decimal(25),
      currency: 'PEN',
      description: 'Pasaje',
      occurredAt: new Date('2026-06-09T12:00:00.000Z'),
      source: 'MANUAL_WEB',
      idempotencyKey: 'key',
      balanceImpactStatus: 'ANALYSIS_ONLY',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      account: { id: 'account-id', name: 'Efectivo' },
      category: { id: 'category-id', name: 'Transporte', icon: null },
    };
    transactionClient.transaction.create.mockResolvedValue(movement);
    transactionClient.auditLog.create.mockResolvedValue({});
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );

    await service.create('user-id', 'WEB', 'key', {
      type: 'EXPENSE',
      amount: 25,
      accountId: 'account-id',
      categoryId: 'category-id',
      occurredAt: new Date('2026-06-09T12:00:00.000Z'),
      description: 'Pasaje',
    });

    expect(transactionClient.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        balanceImpactStatus: 'ANALYSIS_ONLY',
      }),
      include: expect.any(Object),
    });
  });

  it('does not delete an opening balance movement', async () => {
    prisma.transaction.findFirst.mockResolvedValue({
      id: 'opening-id',
      type: 'OPENING_BALANCE',
    });

    await expect(
      service.remove('user-id', 'WEB', 'opening-id'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.transaction.update).not.toHaveBeenCalled();
  });

  it('filters movements by currency without combining balances', async () => {
    prisma.transaction.findMany.mockResolvedValue([]);
    prisma.transaction.count.mockResolvedValue(0);
    prisma.transaction.groupBy.mockResolvedValue([]);

    await service.findAll('user-id', {
      page: 1,
      limit: 20,
      currency: 'USD',
    });

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-id',
          currency: 'USD',
        }),
      }),
    );
  });

  it('keeps opening balances separate from income and expenses in summary', async () => {
    prisma.transaction.findMany.mockResolvedValue([]);
    prisma.transaction.count.mockResolvedValue(0);
    prisma.transaction.groupBy.mockResolvedValue([
      {
        currency: 'PEN',
        type: 'OPENING_BALANCE',
        _sum: { amount: new Prisma.Decimal(150) },
      },
      {
        currency: 'PEN',
        type: 'EXPENSE',
        _sum: { amount: new Prisma.Decimal(25) },
      },
    ]);

    const result = await service.findAll('user-id', {
      page: 1,
      limit: 20,
    });

    expect(result.summary).toEqual([
      {
        currency: 'PEN',
        type: 'OPENING_BALANCE',
        amount: '150.0000',
      },
      {
        currency: 'PEN',
        type: 'EXPENSE',
        amount: '25.0000',
      },
    ]);
  });
});
