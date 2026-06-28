import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ProfileService } from './profile.service';

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

describe('ProfileService', () => {
  const prisma = {
    profile: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
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
    account: { updateMany: jest.fn() },
    accountChannelDefault: { deleteMany: jest.fn() },
    budget: { deleteMany: jest.fn() },
    category: { updateMany: jest.fn() },
    coachConversation: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    coachMessage: { updateMany: jest.fn() },
    emailVerificationToken: { deleteMany: jest.fn() },
    externalChannelLink: { updateMany: jest.fn() },
    fileObject: { updateMany: jest.fn() },
    financialGroup: { updateMany: jest.fn() },
    goal: { updateMany: jest.fn() },
    goalReservation: { updateMany: jest.fn() },
    groupExpense: { updateMany: jest.fn() },
    groupMember: { updateMany: jest.fn() },
    groupSettlement: { updateMany: jest.fn() },
    passwordResetToken: { deleteMany: jest.fn() },
    profile: {
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    recurringOccurrence: { updateMany: jest.fn() },
    recurringSchedule: { updateMany: jest.fn() },
    refreshToken: { deleteMany: jest.fn() },
    transaction: { updateMany: jest.fn() },
    transactionAttachment: { deleteMany: jest.fn() },
    transactionDraft: { updateMany: jest.fn() },
    user: { update: jest.fn() },
    userOnboardingObjective: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    userSession: { deleteMany: jest.fn() },
    voiceTranscription: { updateMany: jest.fn() },
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

  it('deletes account data and marks the user as deleted', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-id',
      passwordHash: 'hash',
    });
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    transactionClient.coachConversation.findMany.mockResolvedValue([
      { id: 'conversation-id' },
    ]);
    transactionClient.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
    transactionClient.userSession.deleteMany.mockResolvedValue({ count: 1 });
    transactionClient.passwordResetToken.deleteMany.mockResolvedValue({
      count: 0,
    });
    transactionClient.emailVerificationToken.deleteMany.mockResolvedValue({
      count: 0,
    });
    transactionClient.user.update.mockResolvedValue({});
    transactionClient.auditLog.create.mockResolvedValue({});

    const result = await service.deleteAccount('user-id', 'WEB', {
      password: 'Password1!',
    });

    expect(result.message).toBe('Cuenta eliminada correctamente.');
    expect(argon2.verify).toHaveBeenCalledWith('hash', 'Password1!');
    expect(transactionClient.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
    });
    expect(transactionClient.transaction.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', deletedAt: null },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { deletedAt: expect.any(Date) },
    });
    expect(transactionClient.profile.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
    });
    expect(transactionClient.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        email: expect.stringMatching(/^deleted-/),
        status: 'DELETED',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        deletedAt: expect.any(Date),
      }),
    });
  });

  it('does not delete account data when the password is invalid', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-id',
      passwordHash: 'hash',
    });
    (argon2.verify as jest.Mock).mockResolvedValue(false);

    await expect(
      service.deleteAccount('user-id', 'WEB', { password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
