/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { GoalsService } from './goals.service';

describe('GoalsService', () => {
  const prisma = {
    goal: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
    },
    transaction: {
      groupBy: jest.fn(),
    },
    goalReservation: {
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const transactionClient = {
    goal: {
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    goalReservation: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };
  let service: GoalsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GoalsService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );
  });

  it('creates and audits a goal', async () => {
    transactionClient.goal.create.mockResolvedValue(goalRecord());
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.create('user-id', 'WEB', {
      name: 'Viaje',
      targetAmount: 1000,
      currency: 'PEN',
    });

    expect(transactionClient.goal.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        name: 'Viaje',
        targetAmount: new Prisma.Decimal(1000),
        currency: 'PEN',
        targetDate: undefined,
      },
      include: expect.any(Object),
    });
    expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'GOAL_CREATED',
        channel: 'WEB',
      }),
    });
    expect(result.reservedAmount).toBe('0.0000');
  });

  it('rejects a goal target date in the past', async () => {
    await expect(
      service.create('user-id', 'WEB', {
        name: 'Viaje',
        targetAmount: 1000,
        currency: 'PEN',
        targetDate: new Date('2000-01-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a reservation greater than account available balance', async () => {
    prisma.goal.findFirst.mockResolvedValue(goalRecord());
    prisma.account.findFirst.mockResolvedValue({
      id: 'account-id',
      currency: 'PEN',
    });
    prisma.transaction.groupBy.mockResolvedValue([
      { type: 'OPENING_BALANCE', _sum: { amount: new Prisma.Decimal(100) } },
    ]);
    prisma.goalReservation.groupBy.mockResolvedValue([
      { accountId: 'account-id', _sum: { amount: new Prisma.Decimal(70) } },
    ]);

    await expect(
      service.reserve('user-id', 'WEB', 'goal-id', {
        accountId: 'account-id',
        amount: 50,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates reservation when account is active, same currency and has available balance', async () => {
    prisma.goal.findFirst.mockResolvedValue(goalRecord());
    prisma.account.findFirst.mockResolvedValue({
      id: 'account-id',
      currency: 'PEN',
    });
    prisma.transaction.groupBy.mockResolvedValue([
      { type: 'OPENING_BALANCE', _sum: { amount: new Prisma.Decimal(500) } },
    ]);
    prisma.goalReservation.groupBy.mockResolvedValue([]);
    transactionClient.goalReservation.create.mockResolvedValue({
      id: 'reservation-id',
    });
    transactionClient.auditLog.create.mockResolvedValue({});
    transactionClient.goal.findUniqueOrThrow.mockResolvedValue(
      goalRecord({
        reservations: [
          reservationRecord({
            amount: new Prisma.Decimal(120),
          }),
        ],
      }),
    );

    const result = await service.reserve('user-id', 'MOBILE', 'goal-id', {
      accountId: 'account-id',
      amount: 120,
      note: 'Ahorro del mes',
    });

    expect(transactionClient.goalReservation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        goalId: 'goal-id',
        accountId: 'account-id',
        amount: new Prisma.Decimal(120),
        source: 'MANUAL_MOBILE',
      }),
    });
    expect(result.reservedAmount).toBe('120.0000');
  });

  it('does not complete a goal before reaching the target amount', async () => {
    prisma.goal.findFirst.mockResolvedValue(
      goalRecord({
        reservations: [reservationRecord({ amount: new Prisma.Decimal(100) })],
      }),
    );

    await expect(
      service.complete('user-id', 'WEB', 'goal-id'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft deletes a cancelled goal and audits the change', async () => {
    prisma.goal.findFirst.mockResolvedValue(
      goalRecord({ status: 'CANCELLED' }),
    );
    transactionClient.goal.update.mockResolvedValue({});
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.remove('user-id', 'WEB', 'goal-id');

    expect(transactionClient.goal.update).toHaveBeenCalledWith({
      where: { id: 'goal-id' },
      data: { deletedAt: expect.any(Date) },
    });
    expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'GOAL_DELETED',
        channel: 'WEB',
      }),
    });
    expect(result.message).toBe('Meta eliminada correctamente.');
  });
});

function goalRecord(
  overrides: Partial<ReturnType<typeof goalRecordBase>> = {},
) {
  return { ...goalRecordBase(), ...overrides };
}

function goalRecordBase() {
  return {
    id: 'goal-id',
    userId: 'user-id',
    name: 'Viaje',
    targetAmount: new Prisma.Decimal(1000),
    currency: 'PEN',
    targetDate: null as Date | null,
    status: 'ACTIVE',
    completedAt: null as Date | null,
    deletedAt: null as Date | null,
    createdAt: new Date('2026-06-25T18:00:00.000Z'),
    updatedAt: new Date('2026-06-25T18:00:00.000Z'),
    reservations: [] as ReturnType<typeof reservationRecord>[],
  };
}

function reservationRecord(
  overrides: Partial<ReturnType<typeof reservationRecordBase>> = {},
) {
  return { ...reservationRecordBase(), ...overrides };
}

function reservationRecordBase() {
  return {
    id: 'reservation-id',
    goalId: 'goal-id',
    userId: 'user-id',
    accountId: 'account-id',
    amount: new Prisma.Decimal(100),
    status: 'ACTIVE',
    source: 'MANUAL_WEB',
    note: null as string | null,
    reservedAt: new Date('2026-06-25T18:00:00.000Z'),
    insufficientAt: null as Date | null,
    reversedAt: null as Date | null,
    createdAt: new Date('2026-06-25T18:00:00.000Z'),
    updatedAt: new Date('2026-06-25T18:00:00.000Z'),
    account: {
      id: 'account-id',
      name: 'Cuenta sueldo',
      currency: 'PEN',
    },
  };
}
