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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ParseSqlServerGuidPipe } from '../../common/validation/sql-server-guid';
import { UpdateOpeningBalanceDto } from './dto/update-opening-balance.dto';
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
    @Param('accountId', ParseSqlServerGuidPipe) accountId: string,
  ) {
    return this.accountsService.findOne(user.userId, accountId);
  }

    @Patch(':accountId/opening-balance')
  updateOpeningBalance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId', ParseSqlServerGuidPipe) accountId: string,
    @Body() dto: UpdateOpeningBalanceDto,
  ) {
    return this.accountsService.updateOpeningBalance(
      user.userId,
      accountId,
      user.platform,
      dto,
    );
  }

  @Patch(':accountId/archive')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId', ParseSqlServerGuidPipe) accountId: string,
  ) {
    return this.accountsService.archive(user.userId, accountId, user.platform);
  }
}
