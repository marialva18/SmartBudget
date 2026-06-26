import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteGroupMemberDto } from './dto/invite-group-member.dto';
import { GroupsService } from './groups.service';

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
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: InviteGroupMemberDto,
  ) {
    return this.groupsService.invite(user.userId, user.platform, groupId, dto);
  }

  @Patch(':groupId/accept')
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    return this.groupsService.accept(user.userId, user.platform, groupId);
  }

  @Patch(':groupId/decline')
  decline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    return this.groupsService.decline(user.userId, user.platform, groupId);
  }

  @Patch(':groupId/archive')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    return this.groupsService.archive(user.userId, user.platform, groupId);
  }
}
