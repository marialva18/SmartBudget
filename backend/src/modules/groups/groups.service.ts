import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateGroupExpenseDto } from './dto/create-group-expense.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteGroupMemberDto } from './dto/invite-group-member.dto';

type Channel = 'WEB' | 'MOBILE';

const groupInclude = {
  expenses: {
    where: { deletedAt: null },
    include: {
      paidByMember: {
        include: {
          user: {
            select: {
              id: true,
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
                  id: true,
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
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { displayName: true } },
        },
      },
    },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  },
} satisfies Prisma.FinancialGroupInclude;

type GroupWithMembers = Prisma.FinancialGroupGetPayload<{
  include: typeof groupInclude;
}>;

const expenseInclude = {
  paidByMember: {
    include: {
      user: {
        select: {
          id: true,
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
              id: true,
              email: true,
              profile: { select: { displayName: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.GroupExpenseInclude;

type GroupExpenseWithDetails = Prisma.GroupExpenseGetPayload<{
  include: typeof expenseInclude;
}>;

type MemberSummary = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
};

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findAll(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'INVITED'] },
        group: { status: 'ACTIVE' },
      },
      include: {
        group: {
          include: groupInclude,
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((membership) =>
      this.toResponse(membership.group, membership),
    );
  }

  async create(userId: string, channel: Channel, dto: CreateGroupDto) {
    const group = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.financialGroup.create({
        data: {
          ownerId: userId,
          name: dto.name,
          description: dto.description,
          members: {
            create: {
              userId,
              role: 'OWNER',
              status: 'ACTIVE',
            },
          },
        },
        include: groupInclude,
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GROUP_CREATED',
          entity: 'FINANCIAL_GROUP',
          entityId: created.id,
          channel,
          newValuesJson: JSON.stringify(this.auditValues(created)),
        },
      });
      return created;
    });

    const membership = group.members.find((member) => member.userId === userId);
    return this.toResponse(group, membership);
  }

  async invite(
    userId: string,
    channel: Channel,
    groupId: string,
    dto: InviteGroupMemberDto,
  ) {
    const requester = await this.findActiveMember(userId, groupId);
    this.assertCanInvite(requester.role);

    const invitedUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true, email: true },
    });
    if (!invitedUser) {
      throw new NotFoundException(es.groups.userMissing);
    }
    if (invitedUser.id === userId) {
      throw new BadRequestException(es.groups.selfInvitation);
    }

    const group = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: invitedUser.id,
          },
        },
      });
      if (existing?.status === 'ACTIVE' || existing?.status === 'INVITED') {
        throw new ConflictException(es.groups.memberDuplicate);
      }

      const member = existing
        ? await transaction.groupMember.update({
            where: { id: existing.id },
            data: {
              role: 'MEMBER',
              status: 'INVITED',
              joinedAt: new Date(),
              leftAt: null,
            },
          })
        : await transaction.groupMember.create({
            data: {
              groupId,
              userId: invitedUser.id,
              role: 'MEMBER',
              status: 'INVITED',
            },
          });

      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GROUP_MEMBER_INVITED',
          entity: 'GROUP_MEMBER',
          entityId: member.id,
          channel,
          newValuesJson: JSON.stringify({
            groupId,
            invitedUserId: invitedUser.id,
            email: invitedUser.email,
          }),
        },
      });

      return transaction.financialGroup.findUniqueOrThrow({
        where: { id: groupId },
        include: groupInclude,
      });
    });

    const requesterSummary = group.members.find(
      (member) => member.userId === userId,
    );
    const notificationEmailSent =
      await this.mailService.sendGroupInvitationEmail({
        groupName: group.name,
        invitedBy:
          requesterSummary?.user.profile?.displayName ??
          requesterSummary?.user.email ??
          'Qori',
        to: invitedUser.email,
      });

    return {
      ...this.toResponse(group, requester),
      notificationEmailSent,
    };
  }

  async accept(userId: string, channel: Channel, groupId: string) {
    const invitation = await this.findInvitation(userId, groupId);
    const group = await this.prisma.$transaction(async (transaction) => {
      const member = await transaction.groupMember.update({
        where: { id: invitation.id },
        data: {
          status: 'ACTIVE',
          joinedAt: new Date(),
          leftAt: null,
        },
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GROUP_INVITATION_ACCEPTED',
          entity: 'GROUP_MEMBER',
          entityId: member.id,
          channel,
          newValuesJson: JSON.stringify({ groupId, status: 'ACTIVE' }),
        },
      });
      return transaction.financialGroup.findUniqueOrThrow({
        where: { id: groupId },
        include: groupInclude,
      });
    });

    const membership = group.members.find((member) => member.userId === userId);
    return this.toResponse(group, membership);
  }

  async decline(userId: string, channel: Channel, groupId: string) {
    const invitation = await this.findInvitation(userId, groupId);
    const leftAt = new Date();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.groupMember.update({
        where: { id: invitation.id },
        data: {
          status: 'REMOVED',
          leftAt,
        },
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GROUP_INVITATION_DECLINED',
          entity: 'GROUP_MEMBER',
          entityId: invitation.id,
          channel,
          newValuesJson: JSON.stringify({
            groupId,
            status: 'REMOVED',
            leftAt: leftAt.toISOString(),
          }),
        },
      });
    });

    return { message: es.groups.invitationDeclined };
  }

  async archive(userId: string, channel: Channel, groupId: string) {
    const requester = await this.findActiveMember(userId, groupId);
    if (requester.role !== 'OWNER') {
      throw new ForbiddenException(es.groups.ownerRequired);
    }

    const archivedAt = new Date();
    const group = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.financialGroup.update({
        where: { id: groupId },
        data: {
          status: 'ARCHIVED',
          archivedAt,
        },
        include: groupInclude,
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GROUP_ARCHIVED',
          entity: 'FINANCIAL_GROUP',
          entityId: updated.id,
          channel,
          newValuesJson: JSON.stringify(this.auditValues(updated)),
        },
      });
      return updated;
    });

    return this.toResponse(group, requester);
  }

  async findExpenses(userId: string, groupId: string) {
    await this.findActiveMember(userId, groupId);
    const expenses = await this.prisma.groupExpense.findMany({
      where: {
        groupId,
        deletedAt: null,
      },
      include: expenseInclude,
      orderBy: { occurredAt: 'desc' },
    });

    return expenses.map((expense) => this.toExpenseResponse(expense));
  }

  async createExpense(
    userId: string,
    channel: Channel,
    groupId: string,
    dto: CreateGroupExpenseDto,
  ) {
    await this.findActiveMember(userId, groupId);
    const activeMembers = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    const activeMemberIds = new Set(activeMembers.map((member) => member.id));
    if (!activeMemberIds.has(dto.paidByMemberId)) {
      throw new BadRequestException(es.groups.invalidPayer);
    }

    const participantIds = Array.from(new Set(dto.participantMemberIds));
    if (
      participantIds.length === 0 ||
      participantIds.some((memberId) => !activeMemberIds.has(memberId))
    ) {
      throw new BadRequestException(es.groups.invalidParticipants);
    }

    const amount = new Prisma.Decimal(dto.amount);
    const splits = this.buildEqualSplits(amount, participantIds);
    const expense = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.groupExpense.create({
        data: {
          groupId,
          paidByMemberId: dto.paidByMemberId,
          createdByUserId: userId,
          description: dto.description.trim(),
          amount,
          currency: dto.currency,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
          splits: {
            createMany: {
              data: splits,
            },
          },
        },
        include: expenseInclude,
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'GROUP_EXPENSE_CREATED',
          entity: 'GROUP_EXPENSE',
          entityId: created.id,
          channel,
          newValuesJson: JSON.stringify({
            groupId,
            paidByMemberId: dto.paidByMemberId,
            amount: amount.toFixed(4),
            currency: dto.currency,
            participants: participantIds,
          }),
        },
      });
      return created;
    });

    return this.toExpenseResponse(expense);
  }

  private async findActiveMember(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: {
        userId,
        groupId,
        status: 'ACTIVE',
        group: { status: 'ACTIVE' },
      },
    });
    if (!member) {
      throw new NotFoundException(es.groups.missing);
    }
    return member;
  }

  private async findInvitation(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: {
        userId,
        groupId,
        status: 'INVITED',
        group: { status: 'ACTIVE' },
      },
    });
    if (!member) {
      throw new NotFoundException(es.groups.invitationMissing);
    }
    return member;
  }

  private assertCanInvite(role: string) {
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException(es.groups.adminRequired);
    }
  }

  private toResponse(
    group: GroupWithMembers,
    currentMembership?: {
      role: string;
      status: string;
    },
  ) {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      status: group.status,
      archivedAt: group.archivedAt,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      currentMemberRole: currentMembership?.role ?? null,
      currentMemberStatus: currentMembership?.status ?? null,
      canInvite:
        currentMembership?.role === 'OWNER' ||
        currentMembership?.role === 'ADMIN',
      canArchive: currentMembership?.role === 'OWNER',
      balances: this.toBalanceSummaries(group),
      recentExpenses: group.expenses
        .slice(0, 5)
        .map((expense) => this.toExpenseResponse(expense)),
      members: group.members.map((member) => ({
        id: member.id,
        userId: member.userId,
        email: member.user.email,
        displayName: member.user.profile?.displayName ?? member.user.email,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        leftAt: member.leftAt,
      })),
    };
  }

  private toExpenseResponse(expense: GroupExpenseWithDetails) {
    return {
      id: expense.id,
      groupId: expense.groupId,
      description: expense.description,
      amount: expense.amount.toFixed(4),
      currency: expense.currency,
      occurredAt: expense.occurredAt,
      createdAt: expense.createdAt,
      paidByMember: this.toMemberSummary(expense.paidByMember),
      splits: expense.splits.map((split) => ({
        id: split.id,
        amount: split.amount.toFixed(4),
        member: this.toMemberSummary(split.member),
      })),
    };
  }

  private toBalanceSummaries(group: GroupWithMembers) {
    const balances = new Map<
      string,
      {
        member: MemberSummary;
        currency: string;
        paid: Prisma.Decimal;
        owed: Prisma.Decimal;
      }
    >();

    const getBalance = (
      member: (typeof group.members)[number],
      currency: string,
    ) => {
      const key = `${member.id}:${currency}`;
      let balance = balances.get(key);
      if (!balance) {
        balance = {
          member: this.toMemberSummary(member),
          currency,
          paid: new Prisma.Decimal(0),
          owed: new Prisma.Decimal(0),
        };
        balances.set(key, balance);
      }
      return balance;
    };

    for (const expense of group.expenses) {
      const payerBalance = getBalance(expense.paidByMember, expense.currency);
      payerBalance.paid = payerBalance.paid.plus(expense.amount);
      for (const split of expense.splits) {
        const balance = getBalance(split.member, expense.currency);
        balance.owed = balance.owed.plus(split.amount);
      }
    }

    return Array.from(balances.values()).map((balance) => ({
      member: balance.member,
      currency: balance.currency,
      paidAmount: balance.paid.toFixed(4),
      owedAmount: balance.owed.toFixed(4),
      netAmount: balance.paid.minus(balance.owed).toFixed(4),
    }));
  }

  private toMemberSummary(member: {
    id: string;
    userId: string;
    role: string;
    status: string;
    user: {
      email: string;
      profile: { displayName: string } | null;
    };
  }): MemberSummary {
    return {
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      displayName: member.user.profile?.displayName ?? member.user.email,
      role: member.role,
      status: member.status,
    };
  }

  private buildEqualSplits(amount: Prisma.Decimal, participantIds: string[]) {
    const baseAmount = amount
      .dividedBy(participantIds.length)
      .toDecimalPlaces(4);
    let assignedAmount = new Prisma.Decimal(0);

    return participantIds.map((memberId, index) => {
      const isLast = index === participantIds.length - 1;
      const splitAmount = isLast ? amount.minus(assignedAmount) : baseAmount;
      assignedAmount = assignedAmount.plus(splitAmount);
      return {
        memberId,
        amount: splitAmount,
      };
    });
  }

  private auditValues(group: GroupWithMembers) {
    return {
      name: group.name,
      description: group.description,
      status: group.status,
      archivedAt: group.archivedAt?.toISOString() ?? null,
    };
  }
}
