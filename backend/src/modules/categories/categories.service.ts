import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { es } from '../../common/i18n/es';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type Channel = 'WEB' | 'MOBILE';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, query: ListCategoriesDto) {
    return this.prisma.category.findMany({
      where: {
        status: query.status === 'ALL' ? undefined : query.status,
        type: query.type,
        OR: [{ isSystem: true }, { userId }],
      },
      orderBy: [{ status: 'asc' }, { isSystem: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        type: true,
        icon: true,
        isSystem: true,
        status: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(userId: string, channel: Channel, dto: CreateCategoryDto) {
    const name = dto.name.trim();
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const category = await transaction.category.create({
          data: {
            userId,
            name,
            type: dto.type,
            icon: dto.icon ?? 'tag',
          },
        });
        await transaction.auditLog.create({
          data: {
            userId,
            action: 'CATEGORY_CREATED',
            entity: 'CATEGORY',
            entityId: category.id,
            channel,
            newValuesJson: JSON.stringify(this.auditValues(category)),
          },
        });
        return category;
      });
    } catch (error) {
      this.handleUniqueConflict(error);
    }
  }

  async update(
    userId: string,
    categoryId: string,
    channel: Channel,
    dto: UpdateCategoryDto,
  ) {
    const current = await this.findAccessible(userId, categoryId);
    this.assertPersonal(current.isSystem);
    if (current.status === 'ARCHIVED') {
      throw new ForbiddenException(es.categories.archivedImmutable);
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const category = await transaction.category.update({
          where: { id: current.id },
          data: {
            name: dto.name?.trim(),
            icon: dto.icon,
          },
        });
        await transaction.auditLog.create({
          data: {
            userId,
            action: 'CATEGORY_UPDATED',
            entity: 'CATEGORY',
            entityId: category.id,
            channel,
            oldValuesJson: JSON.stringify(this.auditValues(current)),
            newValuesJson: JSON.stringify(this.auditValues(category)),
          },
        });
        return category;
      });
    } catch (error) {
      this.handleUniqueConflict(error);
    }
  }

  async archive(userId: string, categoryId: string, channel: Channel) {
    const current = await this.findAccessible(userId, categoryId);
    this.assertPersonal(current.isSystem);
    if (current.status === 'ARCHIVED') {
      return current;
    }

    const archivedAt = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const category = await transaction.category.update({
        where: { id: current.id },
        data: {
          status: 'ARCHIVED',
          archivedAt,
        },
      });
      await transaction.auditLog.create({
        data: {
          userId,
          action: 'CATEGORY_ARCHIVED',
          entity: 'CATEGORY',
          entityId: category.id,
          channel,
          oldValuesJson: JSON.stringify(this.auditValues(current)),
          newValuesJson: JSON.stringify(this.auditValues(category)),
        },
      });
      return category;
    });
  }

  private async findAccessible(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ isSystem: true }, { userId }],
      },
    });
    if (!category) {
      throw new NotFoundException(es.categories.missing);
    }
    return category;
  }

  private assertPersonal(isSystem: boolean) {
    if (isSystem) {
      throw new ForbiddenException(es.categories.systemImmutable);
    }
  }

  private handleUniqueConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(es.categories.duplicate);
    }
    throw error;
  }

  private auditValues(category: {
    name: string;
    type: string;
    icon: string | null;
    status: string;
    archivedAt: Date | null;
  }) {
    return {
      name: category.name,
      type: category.type,
      icon: category.icon,
      status: category.status,
      archivedAt: category.archivedAt?.toISOString() ?? null,
    };
  }
}
