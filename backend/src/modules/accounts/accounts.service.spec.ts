/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  const accountRecord = {
    id: 'account-id',
    userId: 'user-id',
    name: 'Cuenta sueldo',
    type: 'BANK',
    currency: 'PEN',
    status: 'ACTIVE',
    archivedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const transactionClient = {
    account: {
      create: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    accountChannelDefault: {
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };
  const prisma = {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      groupBy: jest.fn(),
    },
    goalReservation: {
      groupBy: jest.fn(),
    },
    accountChannelDefault: {
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: AccountsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccountsService(prisma as unknown as PrismaService);
  });

  it('creates an account and an opening movement atomically', async () => {
    transactionClient.account.create.mockResolvedValue(accountRecord);
    transactionClient.transaction.create.mockResolvedValue({});
    transactionClient.auditLog.create.mockResolvedValue({});
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );

    const result = await service.create('user-id', 'WEB', {
      name: ' Cuenta sueldo ',
      type: 'BANK',
      currency: 'PEN',
      openingBalance: 1500,
    });

    expect(transactionClient.account.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        name: 'Cuenta sueldo',
        type: 'BANK',
        currency: 'PEN',
      },
    });
    expect(transactionClient.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-id',
        accountId: 'account-id',
        type: 'OPENING_BALANCE',
        amount: new Prisma.Decimal(1500),
        source: 'SYSTEM_OPENING',
      }),
    });
    expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-id',
        entityId: 'account-id',
        channel: 'WEB',
      }),
    });
    expect(result.realBalance).toBe('1500.0000');
    expect(result.availableBalance).toBe('1500.0000');
  });

  it('calculates real, reserved and available balances', async () => {
    prisma.account.findMany.mockResolvedValue([accountRecord]);
    prisma.transaction.groupBy.mockResolvedValue([
      {
        accountId: 'account-id',
        type: 'OPENING_BALANCE',
        _sum: { amount: new Prisma.Decimal(1000) },
      },
      {
        accountId: 'account-id',
        type: 'INCOME',
        _sum: { amount: new Prisma.Decimal(500) },
      },
      {
        accountId: 'account-id',
        type: 'EXPENSE',
        _sum: { amount: new Prisma.Decimal(200) },
      },
    ]);
    prisma.goalReservation.groupBy.mockResolvedValue([
      {
        accountId: 'account-id',
        _sum: { amount: new Prisma.Decimal(300) },
      },
    ]);

    const result = await service.findAll('user-id');

    expect(result[0]).toEqual(
      expect.objectContaining({
        realBalance: '1300.0000',
        reservedAmount: '300.0000',
        availableBalance: '1000.0000',
      }),
    );
    expect(prisma.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-id' } }),
    );
  });

  it('does not return an account owned by another user', async () => {
    prisma.account.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('user-id', 'other-account-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-account-id', userId: 'user-id' },
    });
  });

  it('archives without deleting and records the actual channel', async () => {
    const archivedAccount = {
      ...accountRecord,
      status: 'ARCHIVED',
      archivedAt: new Date(),
    };
    prisma.account.findFirst.mockResolvedValue(accountRecord);
    transactionClient.account.update.mockResolvedValue(archivedAccount);
    transactionClient.accountChannelDefault.deleteMany.mockResolvedValue({
      count: 0,
    });
    transactionClient.auditLog.create.mockResolvedValue({});
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );
    prisma.transaction.groupBy.mockResolvedValue([]);
    prisma.goalReservation.groupBy.mockResolvedValue([]);

    const result = await service.archive('user-id', 'account-id', 'MOBILE');

    expect(transactionClient.account.update).toHaveBeenCalledWith({
      where: { id: 'account-id' },
      data: {
        status: 'ARCHIVED',
        archivedAt: expect.any(Date),
      },
    });
    expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-id',
        channel: 'MOBILE',
        action: 'ACCOUNT_ARCHIVED',
      }),
    });
    expect(result.status).toBe('ARCHIVED');
  });
});
