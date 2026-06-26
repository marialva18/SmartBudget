/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  const prisma = {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const transactionClient = {
    category: {
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };
  let service: CategoriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CategoriesService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );
  });

  it('lists active categories by default', async () => {
    prisma.category.findMany.mockResolvedValue([]);

    await service.findAll('user-id', { status: 'ACTIVE' });

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'ACTIVE',
          type: undefined,
          OR: [{ isSystem: true }, { userId: 'user-id' }],
        },
      }),
    );
  });

  it('creates and audits a personal category', async () => {
    const category = categoryRecord();
    transactionClient.category.create.mockResolvedValue(category);
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.create('user-id', 'WEB', {
      name: ' Mascotas ',
      type: 'EXPENSE',
      icon: 'heart',
    });

    expect(transactionClient.category.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        name: 'Mascotas',
        type: 'EXPENSE',
        icon: 'heart',
      },
    });
    expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CATEGORY_CREATED',
        entityId: 'category-id',
        channel: 'WEB',
      }),
    });
    expect(result.name).toBe('Mascotas');
  });

  it('does not allow modifying a system category', async () => {
    prisma.category.findFirst.mockResolvedValue(
      categoryRecord({ isSystem: true }),
    );

    await expect(
      service.update('user-id', 'category-id', 'WEB', { name: 'Cambio' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not expose another user category', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      service.archive('user-id', 'other-category', 'WEB'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('archives without deleting and records the channel', async () => {
    const current = categoryRecord();
    prisma.category.findFirst.mockResolvedValue(current);
    transactionClient.category.update.mockResolvedValue(
      categoryRecord({
        status: 'ARCHIVED',
        archivedAt: new Date('2026-06-25T20:00:00.000Z'),
      }),
    );
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.archive('user-id', 'category-id', 'MOBILE');

    expect(transactionClient.category.update).toHaveBeenCalledWith({
      where: { id: 'category-id' },
      data: {
        status: 'ARCHIVED',
        archivedAt: expect.any(Date),
      },
    });
    expect(transactionClient.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CATEGORY_ARCHIVED',
        channel: 'MOBILE',
      }),
    });
    expect(result.status).toBe('ARCHIVED');
  });
});

function categoryRecord(
  overrides: Partial<ReturnType<typeof categoryRecordBase>> = {},
) {
  return { ...categoryRecordBase(), ...overrides };
}

function categoryRecordBase() {
  return {
    id: 'category-id',
    userId: 'user-id',
    name: 'Mascotas',
    type: 'EXPENSE',
    icon: 'heart',
    isSystem: false,
    status: 'ACTIVE',
    archivedAt: null as Date | null,
    createdAt: new Date('2026-06-25T18:00:00.000Z'),
    updatedAt: new Date('2026-06-25T18:00:00.000Z'),
  };
}
