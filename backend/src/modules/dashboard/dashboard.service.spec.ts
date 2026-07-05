import { PrismaService } from '../../database/prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const prisma = {
    profile: { findUnique: jest.fn() },
    transaction: { groupBy: jest.fn(), findMany: jest.fn() },
    goalReservation: { findMany: jest.fn() },
    budget: { findMany: jest.fn() },
    goal: { findMany: jest.fn() },
  };

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.profile.findUnique.mockResolvedValue({ timezone: 'America/Lima' });
    prisma.transaction.groupBy.mockResolvedValue([]);
    prisma.transaction.findMany.mockResolvedValue([]);
    prisma.goalReservation.findMany.mockResolvedValue([]);
    prisma.budget.findMany.mockResolvedValue([]);
    prisma.goal.findMany.mockResolvedValue([]);
    service = new DashboardService(prisma as unknown as PrismaService);
  });

  it('uses local month boundaries for monthly activity and current balance only from balance-affecting movements', async () => {
    await service.summary('user-id', {
      currency: 'PEN',
      monthStart: '2026-07-01',
    });

    expect(prisma.transaction.groupBy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          balanceImpactStatus: 'AFFECTS_BALANCE',
        }),
      }),
    );
    expect(prisma.transaction.groupBy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          occurredAt: {
            gte: new Date('2026-07-01T05:00:00.000Z'),
            lt: new Date('2026-08-01T05:00:00.000Z'),
          },
        }),
      }),
    );
    expect(prisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          monthStart: new Date('2026-07-01T00:00:00.000Z'),
        }),
      }),
    );
  });
});
