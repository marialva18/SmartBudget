import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import {
  DEFAULT_TIMEZONE,
  toLocalDateKey,
} from '../../common/dates/local-date';
import { PrismaService } from '../../database/prisma/prisma.service';
import { buildAnalyticsPdfReport } from './analytics-pdf-report';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

const transactionInclude = {
  account: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, icon: true } },
} satisfies Prisma.TransactionInclude;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, query: AnalyticsQueryDto) {
    const where = this.buildWhere(userId, query);
    const [rows, topExpense, transactions] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['currency', 'type'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.transaction.findFirst({
        where: { ...where, type: 'EXPENSE' },
        include: transactionInclude,
        orderBy: { amount: 'desc' },
      }),
      this.prisma.transaction.findMany({
        where,
        include: transactionInclude,
        orderBy: { occurredAt: 'asc' },
      }),
    ]);

    const totals = this.getTotals(rows);
    const categoryTotals = this.sumExpensesByCategory(transactions);
    const accountTotals = this.sumByAccount(transactions);
    const dayTotals = await this.sumExpensesByDay(userId, transactions);
    const [comparison, budgetUsage] = await Promise.all([
      this.getPeriodComparison(userId, query, totals),
      this.getBudgetUsage(userId, query),
    ]);

    return {
      totals: {
        income: totals.income.toFixed(4),
        expense: totals.expense.toFixed(4),
      },
      balance: totals.income.minus(totals.expense).toFixed(4),
      movementCount: rows.reduce((total, row) => total + row._count._all, 0),
      topExpenseCategory: maxEntry(categoryTotals),
      mostUsedAccount: maxEntry(accountTotals),
      highestExpense: topExpense
        ? this.toTransactionResponse(topExpense)
        : null,
      highestExpenseDay: maxEntry(dayTotals),
      averageDailyExpense: averageDecimal(dayTotals).toFixed(4),
      comparison,
      budgetUsage,
    };
  }

  async byCategory(userId: string, query: AnalyticsQueryDto) {
    const where = { ...this.buildWhere(userId, query), type: 'EXPENSE' };
    const rows = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'currency'],
      where,
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: 'desc' } },
    });
    const categoryIds = rows
      .map((row) => row.categoryId)
      .filter((categoryId): categoryId is string => Boolean(categoryId));
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true },
    });
    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );

    return rows.map((row) => ({
      categoryId: row.categoryId,
      category: row.categoryId
        ? (categoryById.get(row.categoryId) ?? null)
        : null,
      currency: row.currency,
      amount: (row._sum.amount ?? new Prisma.Decimal(0)).toFixed(4),
      count: row._count._all,
    }));
  }

  async byAccount(userId: string, query: AnalyticsQueryDto) {
    const rows = await this.prisma.transaction.groupBy({
      by: ['accountId', 'currency', 'type'],
      where: this.buildWhere(userId, query),
      _sum: { amount: true },
      _count: { _all: true },
    });
    const accountIds = Array.from(new Set(rows.map((row) => row.accountId)));
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds }, userId },
      select: { id: true, name: true, currency: true },
    });
    const accountById = new Map(
      accounts.map((account) => [account.id, account]),
    );

    return rows.map((row) => ({
      account: accountById.get(row.accountId) ?? null,
      currency: row.currency,
      type: row.type,
      amount: (row._sum.amount ?? new Prisma.Decimal(0)).toFixed(4),
      count: row._count._all,
    }));
  }

  async timeline(userId: string, query: AnalyticsQueryDto) {
    const transactions = await this.prisma.transaction.findMany({
      where: this.buildWhere(userId, query),
      orderBy: { occurredAt: 'asc' },
      select: {
        type: true,
        amount: true,
        currency: true,
        occurredAt: true,
      },
    });
    const timezone = await this.getTimezone(userId);
    const buckets = new Map<
      string,
      {
        income: Prisma.Decimal;
        expense: Prisma.Decimal;
        currencies: Set<string>;
      }
    >();

    for (const transaction of transactions) {
      const day = toLocalDateKey(transaction.occurredAt, timezone);
      const bucket = buckets.get(day) ?? {
        income: new Prisma.Decimal(0),
        expense: new Prisma.Decimal(0),
        currencies: new Set<string>(),
      };
      bucket.currencies.add(transaction.currency);

      if (transaction.type === 'INCOME') {
        bucket.income = bucket.income.plus(transaction.amount);
      }

      if (transaction.type === 'EXPENSE') {
        bucket.expense = bucket.expense.plus(transaction.amount);
      }

      buckets.set(day, bucket);
    }

    return Array.from(buckets.entries()).map(([date, bucket]) => ({
      date,
      income: bucket.income.toFixed(4),
      expense: bucket.expense.toFixed(4),
      balance: bucket.income.minus(bucket.expense).toFixed(4),
      currencies: Array.from(bucket.currencies).sort(),
    }));
  }

  async topExpenses(userId: string, query: AnalyticsQueryDto) {
    const transactions = await this.prisma.transaction.findMany({
      where: { ...this.buildWhere(userId, query), type: 'EXPENSE' },
      include: transactionInclude,
      orderBy: { amount: 'desc' },
      take: 10,
    });

    return transactions.map((transaction) =>
      this.toTransactionResponse(transaction),
    );
  }

  async exportWorkbook(userId: string, query: AnalyticsQueryDto) {
    const [
      summary,
      categories,
      accounts,
      timeline,
      topExpenses,
      transactions,
      groupExpenses,
    ] = await Promise.all([
      this.summary(userId, query),
      this.byCategory(userId, query),
      this.byAccount(userId, query),
      this.timeline(userId, query),
      this.topExpenses(userId, query),
      this.getTransactions(userId, query),
      this.getGroupExpenses(userId, query),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Qori';
    workbook.created = new Date();

    const filtersSheet = workbook.addWorksheet('Filtros');
    filtersSheet.columns = [
      { header: 'Filtro', key: 'filter', width: 28 },
      { header: 'Valor', key: 'value', width: 34 },
    ];
    filtersSheet.addRows(getFilterRows(query));

    const summarySheet = workbook.addWorksheet('Resumen');
    summarySheet.columns = [
      { header: 'Indicador', key: 'metric', width: 28 },
      { header: 'Valor', key: 'value', width: 24 },
    ];
    summarySheet.addRows([
      { metric: 'Ingresos', value: summary.totals.income },
      { metric: 'Gastos', value: summary.totals.expense },
      { metric: 'Balance', value: summary.balance },
      { metric: 'Movimientos', value: summary.movementCount },
      {
        metric: 'Categoría principal',
        value: summary.topExpenseCategory?.name ?? 'Sin datos',
      },
      {
        metric: 'Cuenta más usada',
        value: summary.mostUsedAccount?.name ?? 'Sin datos',
      },
      { metric: 'Gasto diario promedio', value: summary.averageDailyExpense },
      {
        metric: 'Gasto del periodo anterior',
        value: summary.comparison?.previousExpense ?? 'Sin datos',
      },
      {
        metric: 'Variación de gastos',
        value: summary.comparison
          ? `${summary.comparison.expenseChangePercent}%`
          : 'Sin datos',
      },
      {
        metric: 'Uso de presupuesto',
        value: summary.budgetUsage
          ? `${summary.budgetUsage.usedPercent}%`
          : 'Sin datos',
      },
    ]);

    const categorySheet = workbook.addWorksheet('Por categoría');
    categorySheet.columns = [
      { header: 'Categoría', key: 'category', width: 28 },
      { header: 'Moneda', key: 'currency', width: 12 },
      { header: 'Monto', key: 'amount', width: 16 },
      { header: 'Cantidad', key: 'count', width: 12 },
    ];
    categorySheet.addRows(
      categories.map((row) => ({
        category: row.category?.name ?? 'Sin categoría',
        currency: row.currency,
        amount: row.amount,
        count: row.count,
      })),
    );

    const accountSheet = workbook.addWorksheet('Por cuenta');
    accountSheet.columns = [
      { header: 'Cuenta', key: 'account', width: 28 },
      { header: 'Tipo', key: 'type', width: 14 },
      { header: 'Moneda', key: 'currency', width: 12 },
      { header: 'Monto', key: 'amount', width: 16 },
      { header: 'Cantidad', key: 'count', width: 12 },
    ];
    accountSheet.addRows(
      accounts.map((row) => ({
        account: row.account?.name ?? 'Cuenta no disponible',
        type: formatTransactionType(row.type),
        currency: row.currency,
        amount: row.amount,
        count: row.count,
      })),
    );

    const timelineSheet = workbook.addWorksheet('Línea de tiempo');
    timelineSheet.columns = [
      { header: 'Fecha', key: 'date', width: 14 },
      { header: 'Ingresos', key: 'income', width: 16 },
      { header: 'Gastos', key: 'expense', width: 16 },
      { header: 'Balance', key: 'balance', width: 16 },
      { header: 'Monedas', key: 'currencies', width: 18 },
    ];
    timelineSheet.addRows(
      timeline.map((row) => ({
        ...row,
        currencies: row.currencies.join(', '),
      })),
    );

    const topExpenseSheet = workbook.addWorksheet('Gastos principales');
    topExpenseSheet.columns = [
      { header: 'Fecha', key: 'occurredAt', width: 22 },
      { header: 'Descripción', key: 'description', width: 32 },
      { header: 'Cuenta', key: 'account', width: 24 },
      { header: 'Categoría', key: 'category', width: 24 },
      { header: 'Moneda', key: 'currency', width: 12 },
      { header: 'Monto', key: 'amount', width: 16 },
      { header: 'Impacto en saldo', key: 'balanceImpactStatus', width: 22 },
    ];
    topExpenseSheet.addRows(
      topExpenses.map((row) => ({
        occurredAt: row.occurredAt.toISOString(),
        description: row.description,
        account: row.account.name,
        category: row.category?.name ?? 'Sin categoría',
        currency: row.currency,
        amount: row.amount,
        balanceImpactStatus: formatBalanceImpactStatus(row.balanceImpactStatus),
      })),
    );

    const transactionSheet = workbook.addWorksheet('Movimientos');
    transactionSheet.columns = [
      { header: 'Fecha', key: 'occurredAt', width: 22 },
      { header: 'Tipo', key: 'type', width: 14 },
      { header: 'Descripción', key: 'description', width: 32 },
      { header: 'Cuenta', key: 'account', width: 24 },
      { header: 'Categoría', key: 'category', width: 24 },
      { header: 'Moneda', key: 'currency', width: 12 },
      { header: 'Monto', key: 'amount', width: 16 },
      { header: 'Impacto en saldo', key: 'balanceImpactStatus', width: 22 },
    ];
    transactionSheet.addRows(
      transactions.map((row) => ({
        occurredAt: row.occurredAt.toISOString(),
        type: formatTransactionType(row.type),
        description: row.description,
        account: row.account.name,
        category: row.category?.name ?? 'Sin categoría',
        currency: row.currency,
        amount: row.amount,
        balanceImpactStatus: formatBalanceImpactStatus(row.balanceImpactStatus),
      })),
    );

    const groupExpenseSheet = workbook.addWorksheet('Gastos grupales');
    groupExpenseSheet.columns = [
      { header: 'Fecha', key: 'occurredAt', width: 22 },
      { header: 'Grupo', key: 'group', width: 24 },
      { header: 'Descripción', key: 'description', width: 32 },
      { header: 'Pagó', key: 'payer', width: 24 },
      { header: 'Moneda', key: 'currency', width: 12 },
      { header: 'Monto', key: 'amount', width: 16 },
      { header: 'Participantes', key: 'splits', width: 42 },
    ];
    groupExpenseSheet.addRows(
      groupExpenses.map((row) => ({
        occurredAt: row.occurredAt.toISOString(),
        group: row.group.name,
        description: row.description,
        payer:
          row.paidByMember.user.profile?.displayName ??
          row.paidByMember.user.email,
        currency: row.currency,
        amount: row.amount.toFixed(4),
        splits: row.splits
          .map(
            (split) =>
              `${split.member.user.profile?.displayName ?? split.member.user.email}: ${split.amount.toFixed(4)}`,
          )
          .join(', '),
      })),
    );

    for (const worksheet of workbook.worksheets) {
      worksheet.getRow(1).font = { bold: true };
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    const workbookBuffer = await workbook.xlsx.writeBuffer();
    const timezone = await this.getTimezone(userId);

    return {
      filename: `qori-analytics-${toLocalDateKey(new Date(), timezone)}.xlsx`,
      buffer: Buffer.from(workbookBuffer),
    };
  }

  async exportPdf(userId: string, query: AnalyticsQueryDto) {
    const [summary, categories, accounts, timeline, topExpenses] =
      await Promise.all([
        this.summary(userId, query),
        this.byCategory(userId, query),
        this.byAccount(userId, query),
        this.timeline(userId, query),
        this.topExpenses(userId, query),
      ]);
    const timezone = await this.getTimezone(userId);
    const today = toLocalDateKey(new Date(), timezone);
    const sections = [
      {
        title: 'Filtros aplicados',
        rows: getFilterRows(query).map((row) => `${row.filter}: ${row.value}`),
      },
      {
        title: 'Resumen',
        rows: [
          `Ingresos: ${summary.totals.income}`,
          `Gastos: ${summary.totals.expense}`,
          `Balance: ${summary.balance}`,
          `Movimientos: ${summary.movementCount}`,
          `Categoría principal: ${summary.topExpenseCategory?.name ?? 'Sin datos'}`,
          `Cuenta más usada: ${summary.mostUsedAccount?.name ?? 'Sin datos'}`,
          `Gasto diario promedio: ${summary.averageDailyExpense}`,
        ],
      },
      {
        title: 'Comparación',
        rows: summary.comparison
          ? [
              `Referencia: ${formatComparisonMode(query.compareWith)}`,
              `Ingresos anteriores: ${summary.comparison.previousIncome}`,
              `Gastos anteriores: ${summary.comparison.previousExpense}`,
              `Balance anterior: ${summary.comparison.previousBalance}`,
              `Variación de ingresos: ${summary.comparison.incomeChangePercent}%`,
              `Variación de gastos: ${summary.comparison.expenseChangePercent}%`,
            ]
          : ['Sin comparación para este filtro.'],
      },
      {
        title: 'Presupuesto',
        rows: summary.budgetUsage
          ? [
              `Límite: ${summary.budgetUsage.plannedAmount} ${summary.budgetUsage.currency}`,
              `Usado: ${summary.budgetUsage.usedAmount} ${summary.budgetUsage.currency}`,
              `Porcentaje usado: ${summary.budgetUsage.usedPercent}%`,
            ]
          : ['Sin presupuesto para este filtro.'],
      },
      {
        title: 'Gastos por categoría',
        rows: categories.slice(0, 10).map((row) => {
          return `${row.category?.name ?? 'Sin categoría'}: ${row.amount} ${row.currency}`;
        }),
      },
      {
        title: 'Gastos por cuenta',
        rows: accounts
          .filter((row) => row.type === 'EXPENSE')
          .slice(0, 10)
          .map((row) => {
            return `${row.account?.name ?? 'Cuenta no disponible'}: ${row.amount} ${row.currency}`;
          }),
      },
      {
        title: 'Evolución reciente',
        rows: timeline.slice(-10).map((row) => {
          return `${row.date}: ingresos ${row.income}, gastos ${row.expense}, balance ${row.balance}`;
        }),
      },
      {
        title: 'Gastos más altos',
        rows: topExpenses.slice(0, 10).map((row) => {
          return `${row.occurredAt.toISOString().slice(0, 10)} - ${row.description ?? row.category?.name ?? 'Sin descripción'}: ${row.amount} ${row.currency}`;
        }),
      },
    ];

    return {
      filename: `qori-analytics-${today}.pdf`,
      buffer: buildAnalyticsPdfReport(
        'Reporte financiero Qori',
        today,
        sections,
      ),
    };
  }

  private buildWhere(
    userId: string,
    query: AnalyticsQueryDto,
  ): Prisma.TransactionWhereInput {
    return {
      userId,
      deletedAt: null,
      type: query.type ?? { in: ['INCOME', 'EXPENSE'] },
      currency: query.currency,
      accountId: query.accountId,
      categoryId: query.categoryId,
      balanceImpactStatus: query.balanceImpactStatus,
      OR: query.groupId
        ? [
            {
              groupExpenses: {
                some: { groupId: query.groupId, deletedAt: null },
              },
            },
            {
              groupSettlements: {
                some: { groupId: query.groupId, deletedAt: null },
              },
            },
          ]
        : undefined,
      occurredAt:
        query.from || query.to
          ? {
              gte: query.from,
              lte: query.to,
            }
          : undefined,
    };
  }

  private async getTransactions(userId: string, query: AnalyticsQueryDto) {
    const transactions = await this.prisma.transaction.findMany({
      where: this.buildWhere(userId, query),
      include: transactionInclude,
      orderBy: { occurredAt: 'desc' },
    });

    return transactions.map((transaction) =>
      this.toTransactionResponse(transaction),
    );
  }

  private async getGroupExpenses(userId: string, query: AnalyticsQueryDto) {
    if (query.type === 'INCOME' || query.categoryId) {
      return [];
    }

    return this.prisma.groupExpense.findMany({
      where: {
        deletedAt: null,
        groupId: query.groupId,
        currency: query.currency,
        personalTransaction:
          query.accountId || query.balanceImpactStatus
            ? {
                is: {
                  accountId: query.accountId,
                  balanceImpactStatus: query.balanceImpactStatus,
                  deletedAt: null,
                },
              }
            : undefined,
        occurredAt:
          query.from || query.to
            ? {
                gte: query.from,
                lte: query.to,
              }
            : undefined,
        group: {
          members: {
            some: { userId, status: 'ACTIVE' },
          },
        },
      },
      include: {
        group: { select: { id: true, name: true } },
        paidByMember: {
          include: {
            user: {
              select: {
                email: true,
                profile: { select: { displayName: true } },
              },
            },
          },
        },
        splits: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    email: true,
                    profile: { select: { displayName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  private async getPeriodComparison(
    userId: string,
    query: AnalyticsQueryDto,
    currentTotals: { income: Prisma.Decimal; expense: Prisma.Decimal },
  ) {
    if (!query.from || !query.to || query.compareWith === 'NONE') {
      return null;
    }

    const previousRange = getComparisonRange(query);
    if (!previousRange) {
      return null;
    }

    const previousQuery = {
      ...query,
      from: previousRange.from,
      to: previousRange.to,
    };
    const rows = await this.prisma.transaction.groupBy({
      by: ['currency', 'type'],
      where: this.buildWhere(userId, previousQuery),
      _sum: { amount: true },
      _count: { _all: true },
    });
    const previousTotals = this.getTotals(rows);
    const previousBalance = previousTotals.income.minus(previousTotals.expense);

    return {
      previousIncome: previousTotals.income.toFixed(4),
      previousExpense: previousTotals.expense.toFixed(4),
      previousBalance: previousBalance.toFixed(4),
      compareWith: query.compareWith ?? 'PREVIOUS_PERIOD',
      previousFrom: previousRange.from.toISOString(),
      previousTo: previousRange.to.toISOString(),
      incomeChangePercent: percentChange(
        previousTotals.income,
        currentTotals.income,
      ),
      expenseChangePercent: percentChange(
        previousTotals.expense,
        currentTotals.expense,
      ),
    };
  }

  private async getBudgetUsage(userId: string, query: AnalyticsQueryDto) {
    if (!query.currency || !query.from) {
      return null;
    }

    const monthStart = new Date(
      Date.UTC(query.from.getUTCFullYear(), query.from.getUTCMonth(), 1),
    );
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        currency: query.currency,
        monthStart,
        categoryId: query.categoryId,
      },
      select: { amount: true },
    });
    const expenseResult = await this.prisma.transaction.aggregate({
      where: {
        userId,
        deletedAt: null,
        type: 'EXPENSE',
        currency: query.currency,
        categoryId: query.categoryId,
        accountId: query.accountId,
        balanceImpactStatus: 'AFFECTS_BALANCE',
        occurredAt:
          query.from || query.to
            ? {
                gte: query.from,
                lte: query.to,
              }
            : undefined,
      },
      _sum: { amount: true },
    });
    const plannedAmount = budgets.reduce(
      (total, budget) => total.plus(budget.amount),
      new Prisma.Decimal(0),
    );
    const usedAmount = expenseResult._sum.amount ?? new Prisma.Decimal(0);

    if (plannedAmount.equals(0)) {
      return null;
    }

    return {
      plannedAmount: plannedAmount.toFixed(4),
      usedAmount: usedAmount.toFixed(4),
      usedPercent: usedAmount.dividedBy(plannedAmount).times(100).toFixed(2),
      currency: query.currency,
    };
  }

  private getTotals(
    rows: Array<{
      type: string;
      _sum: { amount: Prisma.Decimal | null };
    }>,
  ) {
    return rows.reduce(
      (totals, row) => {
        const amount = row._sum.amount ?? new Prisma.Decimal(0);

        if (row.type === 'INCOME') {
          totals.income = totals.income.plus(amount);
        }

        if (row.type === 'EXPENSE') {
          totals.expense = totals.expense.plus(amount);
        }

        return totals;
      },
      {
        income: new Prisma.Decimal(0),
        expense: new Prisma.Decimal(0),
      },
    );
  }

  private sumExpensesByCategory(
    transactions: Array<
      Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>
    >,
  ) {
    const totals = new Map<string, Prisma.Decimal>();

    for (const transaction of transactions) {
      if (transaction.type !== 'EXPENSE') {
        continue;
      }

      const key = transaction.category?.name ?? 'Sin categoria';
      totals.set(
        key,
        (totals.get(key) ?? new Prisma.Decimal(0)).plus(transaction.amount),
      );
    }

    return totals;
  }

  private sumByAccount(
    transactions: Array<
      Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>
    >,
  ) {
    const totals = new Map<string, Prisma.Decimal>();

    for (const transaction of transactions) {
      totals.set(
        transaction.account.name,
        (totals.get(transaction.account.name) ?? new Prisma.Decimal(0)).plus(
          transaction.amount,
        ),
      );
    }

    return totals;
  }

  private async sumExpensesByDay(
    userId: string,
    transactions: Array<
      Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>
    >,
  ) {
    const timezone = await this.getTimezone(userId);
    const totals = new Map<string, Prisma.Decimal>();

    for (const transaction of transactions) {
      if (transaction.type !== 'EXPENSE') {
        continue;
      }

      const key = toLocalDateKey(transaction.occurredAt, timezone);
      totals.set(
        key,
        (totals.get(key) ?? new Prisma.Decimal(0)).plus(transaction.amount),
      );
    }

    return totals;
  }

  private async getTimezone(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { timezone: true },
    });

    return profile?.timezone ?? DEFAULT_TIMEZONE;
  }

  private toTransactionResponse(
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
      balanceImpactStatus: transaction.balanceImpactStatus,
      account: transaction.account,
      category: transaction.category,
    };
  }
}

function maxEntry(values: Map<string, Prisma.Decimal>) {
  let selected: { name: string; amount: Prisma.Decimal } | null = null;

  for (const [name, amount] of values.entries()) {
    if (!selected || amount.greaterThan(selected.amount)) {
      selected = { name, amount };
    }
  }

  return selected
    ? { name: selected.name, amount: selected.amount.toFixed(4) }
    : null;
}

function averageDecimal(values: Map<string, Prisma.Decimal>) {
  if (values.size === 0) {
    return new Prisma.Decimal(0);
  }

  return Array.from(values.values())
    .reduce((total, value) => total.plus(value), new Prisma.Decimal(0))
    .dividedBy(values.size);
}

function percentChange(previous: Prisma.Decimal, current: Prisma.Decimal) {
  if (previous.equals(0)) {
    return current.equals(0) ? '0.00' : '100.00';
  }

  return current.minus(previous).dividedBy(previous).times(100).toFixed(2);
}

function getFilterRows(query: AnalyticsQueryDto) {
  return [
    { filter: 'Desde', value: query.from?.toISOString() ?? 'Sin filtro' },
    { filter: 'Hasta', value: query.to?.toISOString() ?? 'Sin filtro' },
    { filter: 'Cuenta', value: query.accountId ?? 'Todas' },
    { filter: 'Categoría', value: query.categoryId ?? 'Todas' },
    { filter: 'Grupo', value: query.groupId ?? 'Todos' },
    { filter: 'Tipo', value: formatTransactionType(query.type) },
    { filter: 'Moneda', value: query.currency ?? 'Todas' },
    { filter: 'Comparación', value: formatComparisonMode(query.compareWith) },
    {
      filter: 'Impacto en saldo',
      value: formatBalanceImpactStatus(query.balanceImpactStatus),
    },
  ];
}

function getComparisonRange(query: AnalyticsQueryDto) {
  if (!query.from || !query.to) {
    return null;
  }

  if (query.compareWith === 'PREVIOUS_MONTH') {
    return {
      from: shiftUtcDate(query.from, { months: -1 }),
      to: shiftUtcDate(query.to, { months: -1 }),
    };
  }

  if (query.compareWith === 'PREVIOUS_YEAR') {
    return {
      from: shiftUtcDate(query.from, { years: -1 }),
      to: shiftUtcDate(query.to, { years: -1 }),
    };
  }

  const periodLengthMs = query.to.getTime() - query.from.getTime();

  if (periodLengthMs <= 0) {
    return null;
  }

  const previousTo = new Date(query.from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - periodLengthMs);

  return { from: previousFrom, to: previousTo };
}

function shiftUtcDate(date: Date, offset: { months?: number; years?: number }) {
  const shifted = new Date(date);

  if (offset.years) {
    shifted.setUTCFullYear(shifted.getUTCFullYear() + offset.years);
  }

  if (offset.months) {
    shifted.setUTCMonth(shifted.getUTCMonth() + offset.months);
  }

  return shifted;
}

function formatTransactionType(type?: string) {
  if (type === 'INCOME') {
    return 'Ingreso';
  }

  if (type === 'EXPENSE') {
    return 'Gasto';
  }

  return 'Ingresos y gastos';
}

function formatBalanceImpactStatus(status?: string) {
  if (status === 'AFFECTS_BALANCE') {
    return 'Afecta saldo';
  }

  if (status === 'ANALYSIS_ONLY') {
    return 'Solo análisis';
  }

  if (status === 'PENDING_FUTURE') {
    return 'Pendiente';
  }

  return 'Todos';
}

function formatComparisonMode(mode?: string) {
  if (mode === 'PREVIOUS_MONTH') {
    return 'Mes anterior';
  }

  if (mode === 'PREVIOUS_YEAR') {
    return 'Año anterior';
  }

  if (mode === 'NONE') {
    return 'Sin comparación';
  }

  return 'Periodo anterior equivalente';
}
