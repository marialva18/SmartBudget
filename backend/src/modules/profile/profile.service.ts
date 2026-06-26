import { BadRequestException, Injectable } from '@nestjs/common';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
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

  private preferenceValues(profile: {
    displayName?: string;
    preferredCurrency: string;
    timezone: string;
    theme: string;
    aiEnabled?: boolean;
  }) {
    return {
      displayName: profile.displayName,
      preferredCurrency: profile.preferredCurrency,
      timezone: profile.timezone,
      theme: profile.theme,
      aiEnabled: profile.aiEnabled,
    };
  }
}
