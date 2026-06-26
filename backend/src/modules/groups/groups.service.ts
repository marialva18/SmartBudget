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
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteGroupMemberDto } from './dto/invite-group-member.dto';

type Channel = 'WEB' | 'MOBILE';

const groupInclude = {
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

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.toResponse(group, requester);
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

  private auditValues(group: GroupWithMembers) {
    return {
      name: group.name,
      description: group.description,
      status: group.status,
      archivedAt: group.archivedAt?.toISOString() ?? null,
    };
  }
}
