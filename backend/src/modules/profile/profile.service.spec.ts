import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const prisma = {
    profile: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    userOnboardingObjective: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    account: {
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const transactionClient = {
    profile: { update: jest.fn() },
    userOnboardingObjective: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };

  let service: ProfileService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProfileService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );
  });

  it('updates one preferred currency without limiting account currencies', async () => {
    prisma.profile.findUniqueOrThrow.mockResolvedValue({
      id: 'profile-id',
      displayName: 'Maria',
      preferredCurrency: 'PEN',
      timezone: 'America/Lima',
      theme: 'SYSTEM',
      aiEnabled: true,
      highExpenseWarningPercent: 50,
      maxExpenseAmountPen: null,
      maxExpenseAmountUsd: null,
    });
    transactionClient.profile.update.mockResolvedValue({
      id: 'profile-id',
      displayName: 'Maria Jesus',
      preferredCurrency: 'USD',
      timezone: 'America/Lima',
      theme: 'SYSTEM',
      aiEnabled: false,
      highExpenseWarningPercent: 70,
      maxExpenseAmountPen: 120,
      maxExpenseAmountUsd: null,
      onboardingCompleted: false,
    });
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.update('user-id', 'WEB', {
      displayName: ' Maria Jesus ',
      preferredCurrency: 'USD',
      aiEnabled: false,
      highExpenseWarningPercent: 70,
      maxExpenseAmountPen: 120,
      maxExpenseAmountUsd: null,
    });

    expect(transactionClient.profile.update).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      data: {
        displayName: 'Maria Jesus',
        preferredCurrency: 'USD',
        timezone: undefined,
        theme: undefined,
        aiEnabled: false,
        highExpenseWarningPercent: 70,
        maxExpenseAmountPen: 120,
        maxExpenseAmountUsd: null,
      },
    });
    expect(result.displayName).toBe('Maria Jesus');
    expect(result.preferredCurrency).toBe('USD');
    expect(result.aiEnabled).toBe(false);
    expect(result.maxExpenseAmountPen).toBe(120);
  });

  it('replaces onboarding objectives atomically', async () => {
    transactionClient.userOnboardingObjective.deleteMany.mockResolvedValue({
      count: 1,
    });
    transactionClient.userOnboardingObjective.createMany.mockResolvedValue({
      count: 2,
    });
    transactionClient.auditLog.create.mockResolvedValue({});

    await service.updateObjectives('user-id', 'WEB', {
      objectives: ['SAVE', 'CREATE_BUDGET'],
    });

    expect(
      transactionClient.userOnboardingObjective.createMany,
    ).toHaveBeenCalledWith({
      data: [
        { userId: 'user-id', objective: 'SAVE' },
        { userId: 'user-id', objective: 'CREATE_BUDGET' },
      ],
    });
  });

  it('does not complete onboarding without an account and objective', async () => {
    prisma.account.count.mockResolvedValue(0);
    prisma.userOnboardingObjective.count.mockResolvedValue(0);

    await expect(
      service.completeOnboarding('user-id', 'WEB'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('completes onboarding after required data exists', async () => {
    prisma.account.count.mockResolvedValue(1);
    prisma.userOnboardingObjective.count.mockResolvedValue(1);
    transactionClient.profile.update.mockResolvedValue({
      id: 'profile-id',
      onboardingCompleted: true,
    });
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.completeOnboarding('user-id', 'WEB');

    expect(result.onboardingCompleted).toBe(true);
    expect(transactionClient.profile.update).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      data: { onboardingCompleted: true },
    });
  });
});
