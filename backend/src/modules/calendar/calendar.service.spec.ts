import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CalendarService } from './calendar.service';

describe('CalendarService', () => {
  const prisma = {
    profile: {
      findUnique: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  };

  let service: CalendarService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CalendarService(prisma as unknown as PrismaService);
  });

  it('groups late-night Lima movements on the local day', async () => {
    prisma.profile.findUnique.mockResolvedValue({ timezone: 'America/Lima' });
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 'transaction-id',
        type: 'EXPENSE',
        amount: new Prisma.Decimal(89.75),
        currency: 'PEN',
        description: 'Cena',
        occurredAt: new Date('2026-06-29T02:18:00.000Z'),
        source: 'MANUAL_WEB',
        account: { id: 'account-id', name: 'Yape' },
        category: { id: 'category-id', name: 'Comida', icon: null },
      },
    ]);

    const result = await service.month('user-id', {
      monthStart: '2026-06-01',
      currency: 'PEN',
    });

    const june28 = result.days.find((day) => day.date === '2026-06-28');
    const june29 = result.days.find((day) => day.date === '2026-06-29');

    expect(june28?.transactions).toHaveLength(1);
    expect(june28?.expenseTotal).toBe('89.7500');
    expect(june29?.transactions).toHaveLength(0);
  });
});
