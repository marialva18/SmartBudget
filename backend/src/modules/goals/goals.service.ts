import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { CreateGoalReservationDto } from './dto/create-goal-reservation.dto';
import { ListGoalsDto } from './dto/list-goals.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

type Channel = 'WEB' | 'MOBILE';

const goalInclude = {
  reservations: {
    include: { account: { select: { id: true, name: true, currency: true } } },
    orderBy: { reservedAt: 'desc' },
  },
} satisfies Prisma.GoalInclude;

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListGoalsDto) {
    const goals = await this.prisma.goal.findMany({
      where: {
        userId,
        deletedAt: null,
        status: query.status,
        currency: query.currency,
      },
      include: goalInclude,
      orderBy: [{ status: 'asc' }, { targetDate: 'asc' }, { name: 'asc' }],
    });
    return goals.map((goal) => this.toResponse(goal));
  }

  async create(userId: string, channel: Channel, dto: CreateGoalDto) {
    this.assertTargetDateNotPast(dto.targetDate);
    const goal = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.goal.create({
        data: {
          userId,
          name: dto.name.trim(),
          targetAmount: new Prisma.Decimal(dto.targetAmount),
          currency: dto.currency,
          targetDate: dto.targetDate,
        },
        include: goalInclude,
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GOAL_CREATED',
          entity: 'GOAL',
          entityId: created.id,
          channel,
          newValuesJson: JSON.stringify(this.goalAuditValues(created)),
        },
      });
      return created;
    });
    return this.toResponse(goal);
  }

  async update(
    userId: string,
    channel: Channel,
    goalId: string,
    dto: UpdateGoalDto,
  ) {
    const current = await this.findOwnedGoal(userId, goalId);
    this.assertTargetDateNotPast(dto.targetDate);
    if (current.status !== 'ACTIVE' && current.status !== 'PAUSED') {
      throw new BadRequestException(es.goals.notEditable);
    }

    const reservedAmount = this.getReservedAmount(current);
    if (
      dto.targetAmount !== undefined &&
      new Prisma.Decimal(dto.targetAmount).lessThan(reservedAmount)
    ) {
      throw new BadRequestException(es.goals.targetBelowReserved);
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const goal = await transaction.goal.update({
        where: { id: current.id },
        data: {
          name: dto.name?.trim(),
          targetAmount:
            dto.targetAmount === undefined
              ? undefined
              : new Prisma.Decimal(dto.targetAmount),
          currency: dto.currency,
          targetDate: dto.targetDate,
        },
        include: goalInclude,
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GOAL_UPDATED',
          entity: 'GOAL',
          entityId: goal.id,
          channel,
          oldValuesJson: JSON.stringify(this.goalAuditValues(current)),
          newValuesJson: JSON.stringify(this.goalAuditValues(goal)),
        },
      });
      return goal;
    });
    return this.toResponse(updated);
  }

  async complete(userId: string, channel: Channel, goalId: string) {
    const current = await this.findOwnedGoal(userId, goalId);
    if (current.status !== 'ACTIVE' && current.status !== 'PAUSED') {
      throw new BadRequestException(es.goals.notEditable);
    }
    if (this.getReservedAmount(current).lessThan(current.targetAmount)) {
      throw new BadRequestException(es.goals.insufficientProgress);
    }
    return this.updateStatus(userId, channel, current, 'COMPLETED', new Date());
  }

  async cancel(userId: string, channel: Channel, goalId: string) {
    const current = await this.findOwnedGoal(userId, goalId);
    if (current.status === 'COMPLETED' || current.status === 'CANCELLED') {
      return this.toResponse(current);
    }
    const reversedAt = new Date();
    const updated = await this.prisma.$transaction(async (transaction) => {
      await transaction.goalReservation.updateMany({
        where: {
          goalId: current.id,
          userId,
          status: { in: ['ACTIVE', 'INSUFFICIENT'] },
        },
        data: {
          status: 'REVERSED',
          reversedAt,
        },
      });
      const goal = await transaction.goal.update({
        where: { id: current.id },
        data: { status: 'CANCELLED', completedAt: null },
        include: goalInclude,
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GOAL_CANCELLED',
          entity: 'GOAL',
          entityId: goal.id,
          channel,
          oldValuesJson: JSON.stringify(this.goalAuditValues(current)),
          newValuesJson: JSON.stringify({
            ...this.goalAuditValues(goal),
            reservationsReversedAt: reversedAt.toISOString(),
          }),
        },
      });
      return goal;
    });
    return this.toResponse(updated);
  }

  async remove(userId: string, channel: Channel, goalId: string) {
    const current = await this.findOwnedGoal(userId, goalId);
    if (current.status !== 'CANCELLED') {
      throw new BadRequestException(es.goals.deleteOnlyCancelled);
    }
    const deletedAt = new Date();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.goal.update({
        where: { id: current.id },
        data: { deletedAt },
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GOAL_DELETED',
          entity: 'GOAL',
          entityId: current.id,
          channel,
          oldValuesJson: JSON.stringify(this.goalAuditValues(current)),
          newValuesJson: JSON.stringify({ deletedAt: deletedAt.toISOString() }),
        },
      });
    });
    return { message: es.goals.deleted };
  }

  async reserve(
    userId: string,
    channel: Channel,
    goalId: string,
    dto: CreateGoalReservationDto,
  ) {
    const [goal, account] = await Promise.all([
      this.findOwnedGoal(userId, goalId),
      this.prisma.account.findFirst({
        where: { id: dto.accountId, userId, status: 'ACTIVE' },
        select: { id: true, currency: true },
      }),
    ]);

    if (goal.status !== 'ACTIVE') {
      throw new BadRequestException(es.goals.notReservable);
    }
    if (!account || account.currency !== goal.currency) {
      throw new BadRequestException(es.goals.invalidAccount);
    }

    const amount = new Prisma.Decimal(dto.amount);
    const available = await this.getAccountAvailableBalance(
      userId,
      dto.accountId,
    );
    if (amount.greaterThan(available)) {
      throw new ConflictException(es.goals.reservationExceedsAvailable);
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const reservation = await transaction.goalReservation.create({
        data: {
          goalId: goal.id,
          userId,
          accountId: account.id,
          amount,
          status: 'ACTIVE',
          source: channel === 'WEB' ? 'MANUAL_WEB' : 'MANUAL_MOBILE',
          note: dto.note,
          reservedAt: dto.reservedAt ?? new Date(),
        },
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GOAL_RESERVATION_CREATED',
          entity: 'GOAL_RESERVATION',
          entityId: reservation.id,
          channel,
          newValuesJson: JSON.stringify({
            goalId: goal.id,
            accountId: account.id,
            amount: amount.toFixed(4),
          }),
        },
      });
      return transaction.goal.findUniqueOrThrow({
        where: { id: goal.id },
        include: goalInclude,
      });
    });
    return this.toResponse(updated);
  }

  async reverseReservation(
    userId: string,
    channel: Channel,
    goalId: string,
    reservationId: string,
  ) {
    const current = await this.prisma.goalReservation.findFirst({
      where: { id: reservationId, goalId, userId },
    });
    if (!current) {
      throw new NotFoundException(es.goals.reservationMissing);
    }
    if (current.status === 'REVERSED') {
      return this.findOneResponse(userId, goalId);
    }

    const reversedAt = new Date();
    const updated = await this.prisma.$transaction(async (transaction) => {
      await transaction.goalReservation.update({
        where: { id: current.id },
        data: { status: 'REVERSED', reversedAt },
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GOAL_RESERVATION_REVERSED',
          entity: 'GOAL_RESERVATION',
          entityId: current.id,
          channel,
          oldValuesJson: JSON.stringify({
            status: current.status,
            amount: current.amount.toFixed(4),
          }),
          newValuesJson: JSON.stringify({
            status: 'REVERSED',
            reversedAt: reversedAt.toISOString(),
          }),
        },
      });
      return transaction.goal.findUniqueOrThrow({
        where: { id: goalId },
        include: goalInclude,
      });
    });
    return this.toResponse(updated);
  }

  private async findOwnedGoal(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId, deletedAt: null },
      include: goalInclude,
    });
    if (!goal) {
      throw new NotFoundException(es.goals.missing);
    }
    return goal;
  }

  private async findOneResponse(userId: string, goalId: string) {
    return this.toResponse(await this.findOwnedGoal(userId, goalId));
  }

  private async updateStatus(
    userId: string,
    channel: Channel,
    current: Prisma.GoalGetPayload<{ include: typeof goalInclude }>,
    status: 'COMPLETED' | 'CANCELLED',
    completedAt: Date | null,
  ) {
    const updated = await this.prisma.$transaction(async (transaction) => {
      const goal = await transaction.goal.update({
        where: { id: current.id },
        data: { status, completedAt },
        include: goalInclude,
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: status === 'COMPLETED' ? 'GOAL_COMPLETED' : 'GOAL_CANCELLED',
          entity: 'GOAL',
          entityId: goal.id,
          channel,
          oldValuesJson: JSON.stringify(this.goalAuditValues(current)),
          newValuesJson: JSON.stringify(this.goalAuditValues(goal)),
        },
      });
      return goal;
    });
    return this.toResponse(updated);
  }

  private async getAccountAvailableBalance(userId: string, accountId: string) {
    const [transactionTotals, reservationTotals] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['type'],
        where: {
          userId,
          accountId,
          deletedAt: null,
          balanceImpactStatus: 'AFFECTS_BALANCE',
        },
        _sum: { amount: true },
      }),
      this.prisma.goalReservation.groupBy({
        by: ['accountId'],
        where: {
          userId,
          accountId,
          status: { in: ['ACTIVE', 'INSUFFICIENT'] },
        },
        _sum: { amount: true },
      }),
    ]);

    let realBalance = new Prisma.Decimal(0);
    for (const total of transactionTotals) {
      const amount = total._sum.amount ?? new Prisma.Decimal(0);
      realBalance = isNegativeBalanceType(total.type)
        ? realBalance.minus(amount)
        : realBalance.plus(amount);
    }
    const reserved = reservationTotals[0]?._sum.amount ?? new Prisma.Decimal(0);
    return realBalance.minus(reserved);
  }

  private getReservedAmount(
    goal: Prisma.GoalGetPayload<{ include: typeof goalInclude }>,
  ) {
    return goal.reservations.reduce((total, reservation) => {
      if (
        reservation.status === 'ACTIVE' ||
        reservation.status === 'INSUFFICIENT'
      ) {
        return total.plus(reservation.amount);
      }
      return total;
    }, new Prisma.Decimal(0));
  }

  private toResponse(
    goal: Prisma.GoalGetPayload<{ include: typeof goalInclude }>,
  ) {
    const reservedAmount = this.getReservedAmount(goal);
    const remainingAmount = goal.targetAmount.minus(reservedAmount);
    const progressPercent = reservedAmount
      .dividedBy(goal.targetAmount)
      .times(100);
    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount.toFixed(4),
      reservedAmount: reservedAmount.toFixed(4),
      remainingAmount: remainingAmount.toFixed(4),
      progressPercent: progressPercent.toFixed(2),
      currency: goal.currency,
      targetDate: goal.targetDate,
      status: goal.status,
      completedAt: goal.completedAt,
      deletedAt: goal.deletedAt,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      reservations: goal.reservations.map((reservation) => ({
        id: reservation.id,
        account: reservation.account,
        amount: reservation.amount.toFixed(4),
        status: reservation.status,
        source: reservation.source,
        note: reservation.note,
        reservedAt: reservation.reservedAt,
        reversedAt: reservation.reversedAt,
      })),
    };
  }

  private goalAuditValues(
    goal: Prisma.GoalGetPayload<{ include: typeof goalInclude }>,
  ) {
    return {
      name: goal.name,
      targetAmount: goal.targetAmount.toFixed(4),
      currency: goal.currency,
      targetDate: goal.targetDate?.toISOString().slice(0, 10) ?? null,
      status: goal.status,
      completedAt: goal.completedAt?.toISOString() ?? null,
      deletedAt: goal.deletedAt?.toISOString() ?? null,
    };
  }

  private assertTargetDateNotPast(targetDate?: Date) {
    if (!targetDate) {
      return;
    }
    const today = new Date();
    const todayStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    if (targetDate < todayStart) {
      throw new BadRequestException(es.goals.targetDateInPast);
    }
  }
}

function isNegativeBalanceType(type: string) {
  return type === 'EXPENSE' || type === 'TRANSFER_OUT';
}
