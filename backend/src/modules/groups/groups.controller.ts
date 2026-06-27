import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CreateGroupExpenseDto } from './dto/create-group-expense.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteGroupMemberDto } from './dto/invite-group-member.dto';
import { GroupsService } from './groups.service';
import { ParseSqlServerGuidPipe } from '../../common/validation/sql-server-guid';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.findAll(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.userId, user.platform, dto);
  }

  @Post(':groupId/invitations')
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId', ParseSqlServerGuidPipe) groupId: string,
    @Body() dto: InviteGroupMemberDto,
  ) {
    return this.groupsService.invite(user.userId, user.platform, groupId, dto);
  }

  @Get(':groupId/expenses')
  findExpenses(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId', ParseSqlServerGuidPipe) groupId: string,
  ) {
    return this.groupsService.findExpenses(user.userId, groupId);
  }

  @Post(':groupId/expenses')
  createExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId', ParseSqlServerGuidPipe) groupId: string,
    @Body() dto: CreateGroupExpenseDto,
  ) {
    return this.groupsService.createExpense(
      user.userId,
      user.platform,
      groupId,
      dto,
    );
  }

  @Patch(':groupId/accept')
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId', ParseSqlServerGuidPipe) groupId: string,
  ) {
    return this.groupsService.accept(user.userId, user.platform, groupId);
  }

  @Patch(':groupId/decline')
  decline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId', ParseSqlServerGuidPipe) groupId: string,
  ) {
    return this.groupsService.decline(user.userId, user.platform, groupId);
  }

  @Patch(':groupId/archive')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId', ParseSqlServerGuidPipe) groupId: string,
  ) {
    return this.groupsService.archive(user.userId, user.platform, groupId);
  }
}
