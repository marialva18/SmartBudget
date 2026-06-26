/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException } from '@nestjs/common';
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
    auditLog: {
      create: jest.fn(),
    },
  };
  let service: GroupsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GroupsService(prisma as unknown as PrismaService);
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
});

function groupRecord() {
  return {
    id: 'group-id',
    ownerId: 'user-id',
    name: 'Viaje familiar',
    description: 'Gastos del viaje',
    status: 'ACTIVE',
    createdAt: new Date('2026-06-26T12:00:00.000Z'),
    updatedAt: new Date('2026-06-26T12:00:00.000Z'),
    archivedAt: null as Date | null,
    members: [memberRecord()],
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
