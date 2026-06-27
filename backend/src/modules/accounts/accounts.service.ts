import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateOpeningBalanceDto } from './dto/update-opening-balance.dto';
type AccountRecord = {
  id: string;
  name: string;
  type: string;
  currency: string;
  status: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BalanceSummary = {
  realBalance: Prisma.Decimal;
  reservedAmount: Prisma.Decimal;
};

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    channel: 'WEB' | 'MOBILE',
    dto: CreateAccountDto,
  ) {
    const name = dto.name.trim();
    const openingBalance = new Prisma.Decimal(dto.openingBalance);

    try {
      const account = await this.prisma.$transaction(async (transaction) => {
        const createdAccount = await transaction.account.create({
          data: {
            userId,
            name,
            type: dto.type,
            currency: dto.currency,
          },
        });

        if (openingBalance.greaterThan(0)) {
          await transaction.transaction.create({
            data: {
              userId,
              accountId: createdAccount.id,
              type: 'OPENING_BALANCE',
              amount: openingBalance,
              currency: dto.currency,
              description: es.accounts.openingBalanceDescription,
              occurredAt: new Date(),
              source: 'SYSTEM_OPENING',
              idempotencyKey: `account-opening:${createdAccount.id}`,
            },
          });
        }

        await transaction.auditLog.create({
          data: {
            userId,
            action: 'ACCOUNT_CREATED',
            entity: 'ACCOUNT',
            entityId: createdAccount.id,
            channel,
            newValuesJson: JSON.stringify({
              name,
              type: dto.type,
              currency: dto.currency,
              openingBalance: openingBalance.toFixed(4),
            }),
          },
        });

        return createdAccount;
      });

      return this.toResponse(account, {
        realBalance: openingBalance,
        reservedAmount: new Prisma.Decimal(0),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(es.accounts.duplicate);
      }
      throw error;
    }
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: [{ status: 'asc' }, { currency: 'asc' }, { name: 'asc' }],
    });

    const balances = await this.getBalanceMap(userId);
    return accounts.map((account) =>
      this.toResponse(account, balances.get(account.id)),
    );
  }

  async findOne(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(es.accounts.missing);
    }

    const balances = await this.getBalanceMap(userId, accountId);
    return this.toResponse(account, balances.get(account.id));
  }

    async updateOpeningBalance(
    userId: string,
    accountId: string,
    channel: 'WEB' | 'MOBILE',
    dto: UpdateOpeningBalanceDto,
  ) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(es.accounts.missing);
    }

    if (account.status === 'ARCHIVED') {
      throw new BadRequestException('No puedes editar una cuenta archivada.');
    }

    const newOpeningBalance = new Prisma.Decimal(dto.openingBalance);

    await this.prisma.$transaction(async (transaction) => {
      const existingOpening = await transaction.transaction.findFirst({
        where: {
          userId,
          accountId: account.id,
          type: 'OPENING_BALANCE',
          source: 'SYSTEM_OPENING',
          deletedAt: null,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (existingOpening) {
        await transaction.transaction.update({
          where: { id: existingOpening.id },
          data: {
            amount: newOpeningBalance,
            currency: account.currency,
            description: es.accounts.openingBalanceDescription,
          },
        });

        await transaction.auditLog.create({
          data: {
            userId,
            action: 'ACCOUNT_OPENING_BALANCE_UPDATED',
            entity: 'ACCOUNT',
            entityId: account.id,
            channel,
            oldValuesJson: JSON.stringify({
              openingBalance: existingOpening.amount.toFixed(4),
            }),
            newValuesJson: JSON.stringify({
              openingBalance: newOpeningBalance.toFixed(4),
            }),
          },
        });

        return;
      }

      if (newOpeningBalance.greaterThan(0)) {
        await transaction.transaction.create({
          data: {
            userId,
            accountId: account.id,
            type: 'OPENING_BALANCE',
            amount: newOpeningBalance,
            currency: account.currency,
            description: es.accounts.openingBalanceDescription,
            occurredAt: account.createdAt,
            source: 'SYSTEM_OPENING',
            idempotencyKey: `account-opening:${account.id}`,
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_OPENING_BALANCE_UPDATED',
          entity: 'ACCOUNT',
          entityId: account.id,
          channel,
          oldValuesJson: JSON.stringify({
            openingBalance: '0.0000',
          }),
          newValuesJson: JSON.stringify({
            openingBalance: newOpeningBalance.toFixed(4),
          }),
        },
      });
    });

    return this.findOne(userId, accountId);
  }

  async archive(userId: string, accountId: string, channel: 'WEB' | 'MOBILE') {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(es.accounts.missing);
    }

    if (account.status === 'ARCHIVED') {
      return this.findOne(userId, accountId);
    }

    const archivedAt = new Date();
    const updated = await this.prisma.$transaction(async (transaction) => {
      const archived = await transaction.account.update({
        where: { id: account.id },
        data: {
          status: 'ARCHIVED',
          archivedAt,
        },
      });

      await transaction.accountChannelDefault.deleteMany({
        where: { accountId: account.id, userId },
      });

      await transaction.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_ARCHIVED',
          entity: 'ACCOUNT',
          entityId: account.id,
          channel,
          oldValuesJson: JSON.stringify({ status: account.status }),
          newValuesJson: JSON.stringify({
            status: 'ARCHIVED',
            archivedAt: archivedAt.toISOString(),
          }),
        },
      });

      return archived;
    });

    const balances = await this.getBalanceMap(userId, accountId);
    return this.toResponse(updated, balances.get(updated.id));
  }

  private async getBalanceMap(
    userId: string,
    accountId?: string,
  ): Promise<Map<string, BalanceSummary>> {
    const accountFilter = accountId ? { accountId } : {};
    const [transactionTotals, reservationTotals] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['accountId', 'type'],
        where: {
          userId,
          deletedAt: null,
          ...accountFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.goalReservation.groupBy({
        by: ['accountId'],
        where: {
          userId,
          status: { in: ['ACTIVE', 'INSUFFICIENT'] },
          ...accountFilter,
        },
        _sum: { amount: true },
      }),
    ]);

    const balances = new Map<string, BalanceSummary>();
    const getSummary = (id: string) => {
      const existing = balances.get(id);
      if (existing) {
        return existing;
      }
      const created = {
        realBalance: new Prisma.Decimal(0),
        reservedAmount: new Prisma.Decimal(0),
      };
      balances.set(id, created);
      return created;
    };

    for (const total of transactionTotals) {
      const summary = getSummary(total.accountId);
      const amount = total._sum.amount ?? new Prisma.Decimal(0);
      summary.realBalance =
        total.type === 'EXPENSE'
          ? summary.realBalance.minus(amount)
          : summary.realBalance.plus(amount);
    }

    for (const total of reservationTotals) {
      const summary = getSummary(total.accountId);
      summary.reservedAmount = total._sum.amount ?? new Prisma.Decimal(0);
    }

    return balances;
  }

  private toResponse(
    account: AccountRecord,
    summary: BalanceSummary = {
      realBalance: new Prisma.Decimal(0),
      reservedAmount: new Prisma.Decimal(0),
    },
  ) {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      status: account.status,
      archivedAt: account.archivedAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      realBalance: summary.realBalance.toFixed(4),
      reservedAmount: summary.reservedAmount.toFixed(4),
      availableBalance: summary.realBalance
        .minus(summary.reservedAmount)
        .toFixed(4),
    };
  }
}
