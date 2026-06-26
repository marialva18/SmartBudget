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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAccountDto,
  ) {
    return this.accountsService.create(user.userId, user.platform, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.findAll(user.userId);
  }

  @Get(':accountId')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ) {
    return this.accountsService.findOne(user.userId, accountId);
  }

  @Patch(':accountId/archive')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ) {
    return this.accountsService.archive(user.userId, accountId, user.platform);
  }
}
