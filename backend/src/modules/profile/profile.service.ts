import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateOnboardingObjectivesDto } from './dto/update-onboarding-objectives.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

type Channel = 'WEB' | 'MOBILE';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(userId: string) {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { userId },
    });

    const objectives = await this.prisma.userOnboardingObjective.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { objective: true },
    });

    return {
      displayName: profile.displayName,
      preferredCurrency: profile.preferredCurrency,
      timezone: profile.timezone,
      theme: profile.theme,
      aiEnabled: profile.aiEnabled,
      highExpenseWarningPercent: profile.highExpenseWarningPercent,
      maxExpenseAmountPen: profile.maxExpenseAmountPen
        ? Number(profile.maxExpenseAmountPen)
        : null,
      maxExpenseAmountUsd: profile.maxExpenseAmountUsd
        ? Number(profile.maxExpenseAmountUsd)
        : null,
      onboardingCompleted: profile.onboardingCompleted,
      objectives: objectives.map((item) => item.objective),
    };
  }

  async update(userId: string, channel: Channel, dto: UpdateProfileDto) {
    const current = await this.prisma.profile.findUniqueOrThrow({
      where: { userId },
    });

    const updated = await this.prisma.$transaction(async (transaction) => {
      const profile = await transaction.profile.update({
        where: { userId },
        data: {
          displayName: dto.displayName?.trim(),
          preferredCurrency: dto.preferredCurrency,
          timezone: dto.timezone?.trim(),
          theme: dto.theme,
          aiEnabled: dto.aiEnabled,
          highExpenseWarningPercent: dto.highExpenseWarningPercent,
          maxExpenseAmountPen: dto.maxExpenseAmountPen,
          maxExpenseAmountUsd: dto.maxExpenseAmountUsd,
        },
      });

      await transaction.auditLog.create({
        data: {
          userId,
          action: 'PROFILE_PREFERENCES_UPDATED',
          entity: 'PROFILE',
          entityId: current.id,
          channel,
          oldValuesJson: JSON.stringify(this.preferenceValues(current)),
          newValuesJson: JSON.stringify(this.preferenceValues(profile)),
        },
      });

      return profile;
    });

    return {
      displayName: updated.displayName,
      preferredCurrency: updated.preferredCurrency,
      timezone: updated.timezone,
      theme: updated.theme,
      aiEnabled: updated.aiEnabled,
      highExpenseWarningPercent: updated.highExpenseWarningPercent,
      maxExpenseAmountPen: updated.maxExpenseAmountPen
        ? Number(updated.maxExpenseAmountPen)
        : null,
      maxExpenseAmountUsd: updated.maxExpenseAmountUsd
        ? Number(updated.maxExpenseAmountUsd)
        : null,
      onboardingCompleted: updated.onboardingCompleted,
    };
  }

  async updateObjectives(
    userId: string,
    channel: Channel,
    dto: UpdateOnboardingObjectivesDto,
  ) {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.userOnboardingObjective.deleteMany({
        where: { userId },
      });

      await transaction.userOnboardingObjective.createMany({
        data: dto.objectives.map((objective) => ({ userId, objective })),
      });

      await transaction.auditLog.create({
        data: {
          userId,
          action: 'ONBOARDING_OBJECTIVES_UPDATED',
          entity: 'PROFILE',
          channel,
          newValuesJson: JSON.stringify({ objectives: dto.objectives }),
        },
      });
    });

    return { objectives: dto.objectives };
  }

  async completeOnboarding(userId: string, channel: Channel) {
    const [accountCount, objectiveCount] = await Promise.all([
      this.prisma.account.count({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.userOnboardingObjective.count({ where: { userId } }),
    ]);

    if (accountCount === 0 || objectiveCount === 0) {
      throw new BadRequestException(es.profile.incompleteOnboarding);
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const profile = await transaction.profile.update({
        where: { userId },
        data: { onboardingCompleted: true },
      });

      await transaction.auditLog.create({
        data: {
          userId,
          action: 'ONBOARDING_COMPLETED',
          entity: 'PROFILE',
          entityId: profile.id,
          channel,
        },
      });

      return profile;
    });

    return {
      onboardingCompleted: updated.onboardingCompleted,
    };
  }

  async deleteAccount(userId: string, channel: Channel, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: 'ACTIVE' },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException(es.auth.invalidCredentials);
    }

    const deletedAt = new Date();
    const anonymizedEmail = `deleted-${randomUUID()}@deleted.qori.local`;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.refreshToken.deleteMany({ where: { userId } });
      await transaction.userSession.deleteMany({ where: { userId } });
      await transaction.passwordResetToken.deleteMany({ where: { userId } });
      await transaction.emailVerificationToken.deleteMany({
        where: { userId },
      });

      const coachConversations = await transaction.coachConversation.findMany({
        where: { userId },
        select: { id: true },
      });
      const coachConversationIds = coachConversations.map(({ id }) => id);

      if (coachConversationIds.length > 0) {
        await transaction.coachMessage.updateMany({
          where: {
            conversationId: { in: coachConversationIds },
            deletedAt: null,
          },
          data: { deletedAt },
        });
      }

      await transaction.coachConversation.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt },
      });

      await transaction.transactionAttachment.deleteMany({
        where: { transaction: { userId } },
      });
      await transaction.transactionDraft.updateMany({
        where: { userId },
        data: {
          status: 'EXPIRED',
          resolvedAt: deletedAt,
        },
      });
      await transaction.recurringOccurrence.updateMany({
        where: { userId, status: 'PENDING' },
        data: {
          status: 'SKIPPED',
          reviewedAt: deletedAt,
        },
      });
      await transaction.recurringSchedule.updateMany({
        where: { userId, status: { not: 'CANCELLED' } },
        data: { status: 'CANCELLED' },
      });
      await transaction.goalReservation.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: {
          status: 'REVERSED',
          reversedAt: deletedAt,
        },
      });
      await transaction.goal.updateMany({
        where: { userId, deletedAt: null },
        data: {
          status: 'CANCELLED',
          deletedAt,
        },
      });
      await transaction.budget.deleteMany({ where: { userId } });
      await transaction.transaction.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt },
      });
      await transaction.accountChannelDefault.deleteMany({
        where: { userId },
      });
      await transaction.account.updateMany({
        where: { userId, status: { not: 'ARCHIVED' } },
        data: {
          status: 'ARCHIVED',
          archivedAt: deletedAt,
        },
      });
      await transaction.category.updateMany({
        where: { userId, status: { not: 'ARCHIVED' } },
        data: {
          status: 'ARCHIVED',
          archivedAt: deletedAt,
        },
      });
      await transaction.groupExpense.updateMany({
        where: { createdByUserId: userId, deletedAt: null },
        data: { deletedAt },
      });
      await transaction.groupSettlement.updateMany({
        where: { createdByUserId: userId, deletedAt: null },
        data: { deletedAt },
      });
      await transaction.groupMember.updateMany({
        where: { userId, status: { in: ['ACTIVE', 'INVITED'] } },
        data: {
          status: 'LEFT',
          leftAt: deletedAt,
        },
      });
      await transaction.financialGroup.updateMany({
        where: { ownerId: userId, status: { not: 'ARCHIVED' } },
        data: {
          status: 'ARCHIVED',
          archivedAt: deletedAt,
        },
      });
      await transaction.voiceTranscription.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt },
      });
      await transaction.fileObject.updateMany({
        where: { userId, deletedAt: null },
        data: {
          status: 'DELETED',
          deletedAt,
        },
      });
      await transaction.externalChannelLink.updateMany({
        where: { userId, status: { not: 'REVOKED' } },
        data: {
          status: 'REVOKED',
          revokedAt: deletedAt,
        },
      });
      await transaction.userOnboardingObjective.deleteMany({
        where: { userId },
      });
      await transaction.profile.deleteMany({ where: { userId } });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_DELETED',
          entity: 'USER',
          entityId: userId,
          channel,
          metadataJson: JSON.stringify({
            deletedAt: deletedAt.toISOString(),
          }),
        },
      });
      await transaction.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          passwordHash: `deleted:${randomUUID()}`,
          status: 'DELETED',
          deletedAt,
        },
      });
    });

    return { message: es.profile.accountDeleted };
  }

  private preferenceValues(profile: {
    displayName?: string;
    preferredCurrency: string;
    timezone: string;
    theme: string;
    aiEnabled?: boolean;
    highExpenseWarningPercent?: number;
    maxExpenseAmountPen?: unknown;
    maxExpenseAmountUsd?: unknown;
  }) {
    return {
      displayName: profile.displayName,
      preferredCurrency: profile.preferredCurrency,
      timezone: profile.timezone,
      theme: profile.theme,
      aiEnabled: profile.aiEnabled,
      highExpenseWarningPercent: profile.highExpenseWarningPercent,
      maxExpenseAmountPen: profile.maxExpenseAmountPen,
      maxExpenseAmountUsd: profile.maxExpenseAmountUsd,
    };
  }
}
