import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

type Channel = 'WEB' | 'MOBILE';

const transactionInclude = {
  account: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, icon: true } },
} satisfies Prisma.TransactionInclude;

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListTransactionsDto) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
      type: query.type,
      currency: query.currency,
      accountId: query.accountId,
      categoryId: query.categoryId,
      description: query.search ? { contains: query.search.trim() } : undefined,
      occurredAt:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom,
              lte: query.dateTo,
            }
          : undefined,
    };

    const [items, total, summary] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: transactionInclude,
        orderBy: { occurredAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.groupBy({
        by: ['currency', 'type'],
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.max(1, Math.ceil(total / query.limit)),
      },
      summary: summary.map((row) => ({
        currency: row.currency,
        type: row.type,
        amount: (row._sum.amount ?? new Prisma.Decimal(0)).toFixed(4),
      })),
    };
  }

  async findOne(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId, deletedAt: null },
      include: transactionInclude,
    });
    if (!transaction) {
      throw new NotFoundException(es.transactions.missing);
    }
    return this.toResponse(transaction);
  }

  async create(
    userId: string,
    channel: Channel,
    idempotencyKey: string,
    dto: CreateTransactionDto,
  ) {
    const context = await this.validateContext(
      userId,
      dto.accountId,
      dto.categoryId,
      dto.type,
    );

    try {
      const created = await this.prisma.$transaction(async (transaction) => {
        const movement = await transaction.transaction.create({
          data: {
            userId,
            accountId: context.account.id,
            categoryId: context.category.id,
            type: dto.type,
            amount: new Prisma.Decimal(dto.amount),
            currency: context.account.currency,
            description: dto.description?.trim() || null,
            occurredAt: dto.occurredAt,
            source: channel === 'WEB' ? 'MANUAL_WEB' : 'MANUAL_MOBILE',
            idempotencyKey,
          },
          include: transactionInclude,
        });

        await transaction.auditLog.create({
          data: {
            userId,
            action: 'TRANSACTION_CREATED',
            entity: 'TRANSACTION',
            entityId: movement.id,
            channel,
            newValuesJson: JSON.stringify(this.auditValues(movement)),
          },
        });
        return movement;
      });
      return this.toResponse(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(es.transactions.duplicate);
      }
      throw error;
    }
  }

  async update(
    userId: string,
    channel: Channel,
    transactionId: string,
    dto: UpdateTransactionDto,
  ) {
    const current = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId, deletedAt: null },
      include: transactionInclude,
    });
    if (!current) {
      throw new NotFoundException(es.transactions.missing);
    }
    if (current.type === 'OPENING_BALANCE') {
      throw new BadRequestException(es.transactions.openingImmutable);
    }

    const type = dto.type ?? (current.type as 'INCOME' | 'EXPENSE');
    const accountId = dto.accountId ?? current.accountId;
    const categoryId = dto.categoryId ?? current.categoryId;
    if (!categoryId) {
      throw new BadRequestException(es.categories.missing);
    }
    const context = await this.validateContext(
      userId,
      accountId,
      categoryId,
      type,
    );

    const updated = await this.prisma.$transaction(async (transaction) => {
      const movement = await transaction.transaction.update({
        where: { id: current.id },
        data: {
          accountId: context.account.id,
          categoryId: context.category.id,
          currency: context.account.currency,
          type,
          amount:
            dto.amount === undefined
              ? undefined
              : new Prisma.Decimal(dto.amount),
          occurredAt: dto.occurredAt,
          description:
            dto.description === undefined
              ? undefined
              : dto.description.trim() || null,
        },
        include: transactionInclude,
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'TRANSACTION_UPDATED',
          entity: 'TRANSACTION',
          entityId: movement.id,
          channel,
          oldValuesJson: JSON.stringify(this.auditValues(current)),
          newValuesJson: JSON.stringify(this.auditValues(movement)),
        },
      });
      return movement;
    });
    return this.toResponse(updated);
  }

  async remove(userId: string, channel: Channel, transactionId: string) {
    const current = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId, deletedAt: null },
      include: transactionInclude,
    });
    if (!current) {
      throw new NotFoundException(es.transactions.missing);
    }
    if (current.type === 'OPENING_BALANCE') {
      throw new BadRequestException(es.transactions.openingImmutable);
    }

    const deletedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: current.id },
        data: { deletedAt },
      }),
      this.prisma.auditLog.create({
        data: {
          userId,
          action: 'TRANSACTION_DELETED',
          entity: 'TRANSACTION',
          entityId: current.id,
          channel,
          oldValuesJson: JSON.stringify(this.auditValues(current)),
          newValuesJson: JSON.stringify({ deletedAt: deletedAt.toISOString() }),
        },
      }),
    ]);
    return { message: es.transactions.deleted };
  }

  private async validateContext(
    userId: string,
    accountId: string,
    categoryId: string,
    type: 'INCOME' | 'EXPENSE',
  ) {
    const [account, category] = await Promise.all([
      this.prisma.account.findFirst({
        where: { id: accountId, userId, status: 'ACTIVE' },
        select: { id: true, currency: true },
      }),
      this.prisma.category.findFirst({
        where: {
          id: categoryId,
          status: 'ACTIVE',
          type,
          OR: [{ isSystem: true }, { userId }],
        },
        select: { id: true },
      }),
    ]);
    if (!account) {
      throw new BadRequestException(es.transactions.invalidAccount);
    }
    if (!category) {
      throw new BadRequestException(es.transactions.invalidCategory);
    }
    return { account, category };
  }

  private toResponse(
    transaction: Prisma.TransactionGetPayload<{
      include: typeof transactionInclude;
    }>,
  ) {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount.toFixed(4),
      currency: transaction.currency,
      description: transaction.description,
      occurredAt: transaction.occurredAt,
      source: transaction.source,
      account: transaction.account,
      category: transaction.category,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  private auditValues(
    transaction: Prisma.TransactionGetPayload<{
      include: typeof transactionInclude;
    }>,
  ) {
    return {
      type: transaction.type,
      amount: transaction.amount.toFixed(4),
      currency: transaction.currency,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      description: transaction.description,
      occurredAt: transaction.occurredAt.toISOString(),
    };
  }
}
