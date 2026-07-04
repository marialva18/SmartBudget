/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GroupsService } from './groups.service';
import { PrismaService } from '../../database/prisma/prisma.service';

describe('GroupsService', () => {
  const prisma = {
    groupMember: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    groupExpense: {
      findMany: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const transactionClient = {
    financialGroup: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    groupMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    groupExpense: {
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    groupSettlement: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };
  const mailService = {
    sendGroupInvitationEmail: jest.fn(),
  };
  let service: GroupsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mailService.sendGroupInvitationEmail.mockResolvedValue(true);
    prisma.account.findFirst.mockResolvedValue({
      id: 'account-id',
      currency: 'PEN',
      balanceStartedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    transactionClient.transaction.create.mockResolvedValue({
      id: 'transaction-id',
    });
    service = new GroupsService(
      prisma as unknown as PrismaService,
      mailService as never,
    );
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );
  });

  it('creates a group with the current user as owner', async () => {
    transactionClient.financialGroup.create.mockResolvedValue(groupRecord());
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.create('user-id', 'WEB', {
      name: 'Viaje familiar',
      description: 'Gastos del viaje',
    });

    expect(transactionClient.financialGroup.create).toHaveBeenCalledWith({
      data: {
        ownerId: 'user-id',
        name: 'Viaje familiar',
        description: 'Gastos del viaje',
        members: {
          create: {
            userId: 'user-id',
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
      include: expect.any(Object),
    });
    expect(result.currentMemberRole).toBe('OWNER');
    expect(result.canInvite).toBe(true);
  });

  it('rejects invitations from regular members', async () => {
    prisma.groupMember.findFirst.mockResolvedValue(
      memberRecord({ role: 'MEMBER' }),
    );

    await expect(
      service.invite('user-id', 'WEB', 'group-id', {
        email: 'friend@example.com',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('invites a registered user and sends an email notification', async () => {
    prisma.groupMember.findFirst.mockResolvedValue(memberRecord());
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-2',
      email: 'friend@example.com',
    });
    transactionClient.groupMember.findUnique.mockResolvedValue(null);
    transactionClient.groupMember.create.mockResolvedValue(
      memberRecord({
        id: 'member-2',
        userId: 'user-2',
        role: 'MEMBER',
        status: 'INVITED',
      }),
    );
    transactionClient.auditLog.create.mockResolvedValue({});
    transactionClient.financialGroup.findUniqueOrThrow.mockResolvedValue(
      groupRecord({
        members: [
          memberRecord(),
          memberRecord({
            id: 'member-2',
            userId: 'user-2',
            role: 'MEMBER',
            status: 'INVITED',
            user: {
              id: 'user-2',
              email: 'friend@example.com',
              profile: { displayName: 'Friend' },
            },
          }),
        ],
      }),
    );

    const result = await service.invite('user-id', 'WEB', 'group-id', {
      email: 'friend@example.com',
    });

    expect(transactionClient.groupMember.create).toHaveBeenCalledWith({
      data: {
        groupId: 'group-id',
        userId: 'user-2',
        role: 'MEMBER',
        status: 'INVITED',
      },
    });
    expect(mailService.sendGroupInvitationEmail).toHaveBeenCalledWith({
      groupName: 'Viaje familiar',
      invitedBy: 'Maria',
      to: 'friend@example.com',
    });
    expect(result.notificationEmailSent).toBe(true);
  });

  it('creates a group expense with equal splits', async () => {
    prisma.groupMember.findFirst.mockResolvedValue(memberRecord());
    prisma.groupMember.findMany.mockResolvedValue([
      { id: 'member-id', userId: 'user-id' },
      { id: 'member-2', userId: 'user-2' },
    ]);
    transactionClient.groupExpense.create.mockResolvedValue(expenseRecord());
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.createExpense('user-id', 'WEB', 'group-id', {
      description: 'Cena',
      amount: 100,
      currency: 'PEN',
      paidByMemberId: 'member-id',
      accountId: 'account-id',
      participantMemberIds: ['member-id', 'member-2'],
      occurredAt: '2026-06-26T20:00:00.000Z',
    });

    expect(transactionClient.groupExpense.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        groupId: 'group-id',
        paidByMemberId: 'member-id',
        personalTransactionId: 'transaction-id',
        amount: new Prisma.Decimal(100),
        currency: 'PEN',
        splits: {
          createMany: {
            data: [
              { memberId: 'member-id', amount: new Prisma.Decimal(50) },
              { memberId: 'member-2', amount: new Prisma.Decimal(50) },
            ],
          },
        },
      }),
      include: expect.any(Object),
    });
    expect(result.amount).toBe('100.0000');
    expect(result.splits).toHaveLength(2);
    expect(transactionClient.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-id',
        accountId: 'account-id',
        type: 'EXPENSE',
        amount: new Prisma.Decimal(100),
        currency: 'PEN',
        source: 'GROUP_EXPENSE',
      }),
    });
  });

  it('creates a group expense with custom amount splits', async () => {
    prisma.groupMember.findFirst.mockResolvedValue(memberRecord());
    prisma.groupMember.findMany.mockResolvedValue([
      { id: 'member-id', userId: 'user-id' },
      { id: 'member-2', userId: 'user-2' },
    ]);
    transactionClient.groupExpense.create.mockResolvedValue(expenseRecord());
    transactionClient.auditLog.create.mockResolvedValue({});

    await service.createExpense('user-id', 'WEB', 'group-id', {
      description: 'Cena',
      amount: 100,
      currency: 'PEN',
      paidByMemberId: 'member-id',
      accountId: 'account-id',
      splitMode: 'CUSTOM_AMOUNTS',
      splits: [
        { memberId: 'member-id', amount: 70 },
        { memberId: 'member-2', amount: 30 },
      ],
      occurredAt: '2026-06-26T20:00:00.000Z',
    });

    expect(transactionClient.groupExpense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          splits: {
            createMany: {
              data: [
                { memberId: 'member-id', amount: new Prisma.Decimal(70) },
                { memberId: 'member-2', amount: new Prisma.Decimal(30) },
              ],
            },
          },
        }),
      }),
    );
  });

  it('creates a group expense with percentage splits', async () => {
    prisma.groupMember.findFirst.mockResolvedValue(memberRecord());
    prisma.groupMember.findMany.mockResolvedValue([
      { id: 'member-id', userId: 'user-id' },
      { id: 'member-2', userId: 'user-2' },
    ]);
    transactionClient.groupExpense.create.mockResolvedValue(expenseRecord());
    transactionClient.auditLog.create.mockResolvedValue({});

    await service.createExpense('user-id', 'WEB', 'group-id', {
      description: 'Cena',
      amount: 100,
      currency: 'PEN',
      paidByMemberId: 'member-id',
      accountId: 'account-id',
      splitMode: 'PERCENTAGES',
      splits: [
        { memberId: 'member-id', percentage: 25 },
        { memberId: 'member-2', percentage: 75 },
      ],
      occurredAt: '2026-06-26T20:00:00.000Z',
    });

    expect(transactionClient.groupExpense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          splits: {
            createMany: {
              data: [
                { memberId: 'member-id', amount: new Prisma.Decimal(25) },
                { memberId: 'member-2', amount: new Prisma.Decimal(75) },
              ],
            },
          },
        }),
      }),
    );
  });

  it('creates a settlement between active members', async () => {
    prisma.groupMember.findFirst.mockResolvedValue(memberRecord());
    prisma.groupMember.findMany.mockResolvedValue([
      { id: 'member-id', userId: 'user-id' },
      { id: 'member-2', userId: 'user-2' },
    ]);
    transactionClient.groupSettlement.create.mockResolvedValue(
      settlementRecord(),
    );
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.createSettlement(
      'user-id',
      'WEB',
      'group-id',
      {
        fromMemberId: 'member-2',
        toMemberId: 'member-id',
        accountId: 'account-id',
        amount: 50,
        currency: 'PEN',
        note: 'Yape',
        settledAt: '2026-06-27T10:00:00.000Z',
      },
    );

    expect(transactionClient.groupSettlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        groupId: 'group-id',
        fromMemberId: 'member-2',
        toMemberId: 'member-id',
        personalTransactionId: 'transaction-id',
        amount: new Prisma.Decimal(50),
        currency: 'PEN',
        note: 'Yape',
      }),
      include: expect.any(Object),
    });
    expect(transactionClient.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-id',
        accountId: 'account-id',
        type: 'INCOME',
        amount: new Prisma.Decimal(50),
        currency: 'PEN',
        source: 'GROUP_SETTLEMENT',
      }),
    });
    expect(result.amount).toBe('50.0000');
    expect(result.fromMember.id).toBe('member-2');
  });
});

function groupRecord(overrides: Partial<ReturnType<typeof groupBase>> = {}) {
  return { ...groupBase(), ...overrides };
}

function groupBase() {
  return {
    id: 'group-id',
    ownerId: 'user-id',
    name: 'Viaje familiar',
    description: 'Gastos del viaje',
    status: 'ACTIVE',
    createdAt: new Date('2026-06-26T12:00:00.000Z'),
    updatedAt: new Date('2026-06-26T12:00:00.000Z'),
    archivedAt: null as Date | null,
    expenses: [],
    settlements: [],
    members: [memberRecord()],
  };
}

function expenseRecord() {
  return {
    id: 'expense-id',
    groupId: 'group-id',
    paidByMemberId: 'member-id',
    createdByUserId: 'user-id',
    personalTransactionId: null as string | null,
    description: 'Cena',
    amount: new Prisma.Decimal(100),
    currency: 'PEN',
    occurredAt: new Date('2026-06-26T20:00:00.000Z'),
    createdAt: new Date('2026-06-26T20:00:00.000Z'),
    updatedAt: new Date('2026-06-26T20:00:00.000Z'),
    deletedAt: null as Date | null,
    paidByMember: memberRecord(),
    splits: [
      splitRecord('split-1', 'member-id', new Prisma.Decimal(50)),
      splitRecord('split-2', 'member-2', new Prisma.Decimal(50)),
    ],
  };
}

function splitRecord(id: string, memberId: string, amount: Prisma.Decimal) {
  return {
    id,
    groupExpenseId: 'expense-id',
    memberId,
    amount,
    createdAt: new Date('2026-06-26T20:00:00.000Z'),
    member: memberRecord({
      id: memberId,
      userId: memberId === 'member-id' ? 'user-id' : 'user-2',
      user:
        memberId === 'member-id'
          ? memberBase().user
          : {
              id: 'user-2',
              email: 'friend@example.com',
              profile: { displayName: 'Friend' },
            },
    }),
  };
}

function settlementRecord() {
  return {
    id: 'settlement-id',
    groupId: 'group-id',
    fromMemberId: 'member-2',
    toMemberId: 'member-id',
    createdByUserId: 'user-id',
    personalTransactionId: null as string | null,
    amount: new Prisma.Decimal(50),
    currency: 'PEN',
    settledAt: new Date('2026-06-27T10:00:00.000Z'),
    note: 'Yape',
    createdAt: new Date('2026-06-27T10:00:00.000Z'),
    deletedAt: null as Date | null,
    fromMember: memberRecord({
      id: 'member-2',
      userId: 'user-2',
      user: {
        id: 'user-2',
        email: 'friend@example.com',
        profile: { displayName: 'Friend' },
      },
    }),
    toMember: memberRecord(),
  };
}

function memberRecord(overrides: Partial<ReturnType<typeof memberBase>> = {}) {
  return { ...memberBase(), ...overrides };
}

function memberBase() {
  return {
    id: 'member-id',
    groupId: 'group-id',
    userId: 'user-id',
    role: 'OWNER',
    status: 'ACTIVE',
    joinedAt: new Date('2026-06-26T12:00:00.000Z'),
    leftAt: null as Date | null,
    user: {
      id: 'user-id',
      email: 'maria@example.com',
      profile: {
        displayName: 'Maria',
      },
    },
  };
}
