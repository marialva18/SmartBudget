import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DEFAULT_TIMEZONE } from '../../common/dates/local-date';
import { getBalanceImpactStatus } from '../../common/finance/balance-impact';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateRecurringScheduleDto } from './dto/create-recurring-schedule.dto';
import { ListRecurringSchedulesDto } from './dto/list-recurring-schedules.dto';

type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

const recurringOccurrenceInclude = {
  schedule: {
    include: {
      account: {
        select: {
          id: true,
          name: true,
          currency: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          type: true,
        },
      },
    },
  },
} satisfies Prisma.RecurringOccurrenceInclude;

type RecurringOccurrenceWithDetails = Prisma.RecurringOccurrenceGetPayload<{
  include: typeof recurringOccurrenceInclude;
}>;

@Injectable()
export class RecurringService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListRecurringSchedulesDto) {
    const schedules = await this.prisma.recurringSchedule.findMany({
      where: {
        userId,
        status: query.status,
        operationType: query.operationType,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            type: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { nextDueOn: 'asc' }, { createdAt: 'desc' }],
    });

    return schedules.map((schedule) => this.toResponse(schedule));
  }
  async findDue(userId: string) {
    const today = toDateOnly(new Date());

    const dueSchedules = await this.prisma.recurringSchedule.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        nextDueOn: {
          lte: today,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            type: true,
          },
        },
      },
      orderBy: {
        nextDueOn: 'asc',
      },
    });

    const validDueSchedules = dueSchedules.filter(
      (schedule) => !schedule.endsOn || schedule.nextDueOn <= schedule.endsOn,
    );

    for (const schedule of validDueSchedules) {
      await this.prisma.recurringOccurrence.upsert({
        where: {
          scheduleId_scheduledFor: {
            scheduleId: schedule.id,
            scheduledFor: schedule.nextDueOn,
          },
        },
        create: {
          scheduleId: schedule.id,
          userId,
          scheduledFor: schedule.nextDueOn,
          status: 'PENDING',
        },
        update: {},
      });
    }

    const occurrences = await this.prisma.recurringOccurrence.findMany({
      where: {
        userId,
        status: 'PENDING',
        scheduledFor: {
          lte: today,
        },
        schedule: {
          status: 'ACTIVE',
        },
      },
      include: recurringOccurrenceInclude,
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    return occurrences.map((occurrence) => this.toDueResponse(occurrence));
  }
  async confirmDue(
    userId: string,
    channel: 'WEB' | 'MOBILE',
    scheduleId: string,
  ) {
    const schedule = await this.findDueSchedule(userId, scheduleId);
    const scheduledFor = toDateOnly(schedule.nextDueOn);
    const timezone = await this.getUserTimezone(userId);

    const result = await this.prisma.$transaction(async (transaction) => {
      const occurrence = await transaction.recurringOccurrence.upsert({
        where: {
          scheduleId_scheduledFor: {
            scheduleId: schedule.id,
            scheduledFor,
          },
        },
        create: {
          scheduleId: schedule.id,
          userId,
          scheduledFor,
          status: 'PENDING',
        },
        update: {},
      });

      if (occurrence.status !== 'PENDING') {
        throw new BadRequestException(
          'Esta recurrencia ya fue revisada para esta fecha.',
        );
      }

      const createdTransaction = await transaction.transaction.create({
        data: {
          userId,
          accountId: schedule.accountId,
          categoryId: schedule.categoryId,
          type: schedule.operationType,
          amount: schedule.amount,
          currency: schedule.currency,
          description:
            schedule.description ??
            schedule.category?.name ??
            'Movimiento recurrente',
          occurredAt: scheduledFor,
          balanceImpactStatus: getBalanceImpactStatus({
            occurredAt: scheduledFor,
            balanceStartedAt: schedule.account.balanceStartedAt,
            timezone,
          }),
          source: 'RECURRING',
          idempotencyKey: `recurring:${schedule.id}:${toDateKey(scheduledFor)}`,
        },
      });

      await transaction.recurringOccurrence.update({
        where: {
          id: occurrence.id,
        },
        data: {
          status: 'CONFIRMED',
          transactionId: createdTransaction.id,
          reviewedAt: new Date(),
        },
      });

      const nextDueOn = getNextDueOn(
        schedule.nextDueOn,
        schedule.frequency,
        schedule.intervalCount,
      );

      const updatedSchedule = await transaction.recurringSchedule.update({
        where: {
          id: schedule.id,
        },
        data: {
          nextDueOn,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              type: true,
            },
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          userId,
          action: 'RECURRING_OCCURRENCE_CONFIRMED',
          entity: 'RECURRING_OCCURRENCE',
          entityId: occurrence.id,
          channel,
          newValuesJson: JSON.stringify({
            scheduleId: schedule.id,
            transactionId: createdTransaction.id,
            scheduledFor: toDateKey(scheduledFor),
            nextDueOn: toDateKey(nextDueOn),
          }),
        },
      });

      return updatedSchedule;
    });

    return this.toResponse(result);
  }
  async skipDue(userId: string, channel: 'WEB' | 'MOBILE', scheduleId: string) {
    const schedule = await this.findDueSchedule(userId, scheduleId);
    const scheduledFor = toDateOnly(schedule.nextDueOn);

    const result = await this.prisma.$transaction(async (transaction) => {
      const occurrence = await transaction.recurringOccurrence.upsert({
        where: {
          scheduleId_scheduledFor: {
            scheduleId: schedule.id,
            scheduledFor,
          },
        },
        create: {
          scheduleId: schedule.id,
          userId,
          scheduledFor,
          status: 'PENDING',
        },
        update: {},
      });

      if (occurrence.status !== 'PENDING') {
        throw new BadRequestException(
          'Esta recurrencia ya fue revisada para esta fecha.',
        );
      }

      await transaction.recurringOccurrence.update({
        where: {
          id: occurrence.id,
        },
        data: {
          status: 'SKIPPED',
          reviewedAt: new Date(),
        },
      });

      const nextDueOn = getNextDueOn(
        schedule.nextDueOn,
        schedule.frequency,
        schedule.intervalCount,
      );

      const updatedSchedule = await transaction.recurringSchedule.update({
        where: {
          id: schedule.id,
        },
        data: {
          nextDueOn,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              type: true,
            },
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          userId,
          action: 'RECURRING_OCCURRENCE_SKIPPED',
          entity: 'RECURRING_OCCURRENCE',
          entityId: occurrence.id,
          channel,
          newValuesJson: JSON.stringify({
            scheduleId: schedule.id,
            scheduledFor: toDateKey(scheduledFor),
            nextDueOn: toDateKey(nextDueOn),
          }),
        },
      });

      return updatedSchedule;
    });

    return this.toResponse(result);
  }
  async create(
    userId: string,
    channel: 'WEB' | 'MOBILE',
    dto: CreateRecurringScheduleDto,
  ) {
    const startsOn = toDateOnly(dto.startsOn);
    const endsOn = dto.endsOn ? toDateOnly(dto.endsOn) : null;

    if (endsOn && endsOn < startsOn) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio.',
      );
    }

    const account = await this.prisma.account.findFirst({
      where: {
        id: dto.accountId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!account) {
      throw new NotFoundException(es.accounts.missing);
    }

    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        status: 'ACTIVE',
        type: dto.operationType,
        OR: [{ userId }, { userId: null }],
      },
    });

    if (!category) {
      throw new BadRequestException('Selecciona una categoría válida.');
    }

    const amount = new Prisma.Decimal(dto.amount);

    const created = await this.prisma.$transaction(async (transaction) => {
      const schedule = await transaction.recurringSchedule.create({
        data: {
          userId,
          accountId: account.id,
          categoryId: category.id,
          operationType: dto.operationType,
          amount,
          currency: account.currency,
          description: normalizeDescription(dto.description),
          frequency: dto.frequency,
          intervalCount: dto.intervalCount,
          startsOn,
          endsOn,
          nextDueOn: startsOn,
          status: 'ACTIVE',
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              type: true,
            },
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          userId,
          action: 'RECURRING_SCHEDULE_CREATED',
          entity: 'RECURRING_SCHEDULE',
          entityId: schedule.id,
          channel,
          newValuesJson: JSON.stringify({
            accountId: account.id,
            categoryId: category.id,
            operationType: dto.operationType,
            amount: amount.toFixed(4),
            currency: account.currency,
            frequency: dto.frequency,
            intervalCount: dto.intervalCount,
            startsOn: toDateKey(startsOn),
            endsOn: endsOn ? toDateKey(endsOn) : null,
          }),
        },
      });

      return schedule;
    });

    return this.toResponse(created);
  }

  async changeStatus(
    userId: string,
    channel: 'WEB' | 'MOBILE',
    scheduleId: string,
    status: RecurringStatus,
  ) {
    const schedule = await this.prisma.recurringSchedule.findFirst({
      where: {
        id: scheduleId,
        userId,
      },
    });

    if (!schedule) {
      throw new NotFoundException('No encontramos esta recurrencia.');
    }

    if (schedule.status === 'CANCELLED') {
      throw new BadRequestException(
        'No puedes modificar una recurrencia cancelada.',
      );
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const changed = await transaction.recurringSchedule.update({
        where: {
          id: schedule.id,
        },
        data: {
          status,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              type: true,
            },
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          userId,
          action: `RECURRING_SCHEDULE_${status}`,
          entity: 'RECURRING_SCHEDULE',
          entityId: schedule.id,
          channel,
          oldValuesJson: JSON.stringify({ status: schedule.status }),
          newValuesJson: JSON.stringify({ status }),
        },
      });

      return changed;
    });

    return this.toResponse(updated);
  }

  private async findDueSchedule(userId: string, scheduleId: string) {
    const today = toDateOnly(new Date());

    const schedule = await this.prisma.recurringSchedule.findFirst({
      where: {
        id: scheduleId,
        userId,
        status: 'ACTIVE',
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            currency: true,
            balanceStartedAt: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            type: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('No encontramos esta recurrencia.');
    }

    if (schedule.nextDueOn > today) {
      throw new BadRequestException(
        'Esta recurrencia todavía no está pendiente.',
      );
    }

    if (schedule.endsOn && schedule.nextDueOn > schedule.endsOn) {
      throw new BadRequestException('Esta recurrencia ya terminó.');
    }

    return schedule;
  }

  private toDueResponse(occurrence: RecurringOccurrenceWithDetails) {
    return {
      id: occurrence.id,
      scheduleId: occurrence.scheduleId,
      scheduledFor: toDateKey(occurrence.scheduledFor),
      status: occurrence.status,
      transactionId: occurrence.transactionId,
      reviewedAt: occurrence.reviewedAt,
      schedule: this.toResponse(occurrence.schedule),
    };
  }

  private async getUserTimezone(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { timezone: true },
    });

    return profile?.timezone ?? DEFAULT_TIMEZONE;
  }

  private toResponse(schedule: {
    id: string;
    operationType: string;
    amount: Prisma.Decimal;
    currency: string;
    description: string | null;
    frequency: string;
    intervalCount: number;
    startsOn: Date;
    endsOn: Date | null;
    nextDueOn: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    account: {
      id: string;
      name: string;
      currency: string;
    };
    category: {
      id: string;
      name: string;
      icon: string | null;
      type: string;
    } | null;
  }) {
    return {
      id: schedule.id,
      operationType: schedule.operationType,
      amount: schedule.amount.toFixed(4),
      currency: schedule.currency,
      description: schedule.description,
      frequency: schedule.frequency,
      intervalCount: schedule.intervalCount,
      startsOn: toDateKey(schedule.startsOn),
      endsOn: schedule.endsOn ? toDateKey(schedule.endsOn) : null,
      nextDueOn: toDateKey(schedule.nextDueOn),
      status: schedule.status,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      account: schedule.account,
      category: schedule.category,
    };
  }
}

function normalizeDescription(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toDateOnly(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getNextDueOn(
  currentDueOn: Date,
  frequency: string,
  intervalCount: number,
) {
  const current = toDateOnly(currentDueOn);

  if (frequency === 'DAILY') {
    return new Date(
      Date.UTC(
        current.getUTCFullYear(),
        current.getUTCMonth(),
        current.getUTCDate() + intervalCount,
      ),
    );
  }

  if (frequency === 'WEEKLY') {
    return new Date(
      Date.UTC(
        current.getUTCFullYear(),
        current.getUTCMonth(),
        current.getUTCDate() + intervalCount * 7,
      ),
    );
  }

  if (frequency === 'MONTHLY') {
    return addMonthsClamped(current, intervalCount);
  }

  throw new BadRequestException('Frecuencia no soportada.');
}

function addMonthsClamped(value: Date, monthsToAdd: number) {
  const originalDay = value.getUTCDate();
  const targetMonthStart = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + monthsToAdd, 1),
  );

  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      targetMonthStart.getUTCFullYear(),
      targetMonthStart.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  targetMonthStart.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));

  return targetMonthStart;
}

