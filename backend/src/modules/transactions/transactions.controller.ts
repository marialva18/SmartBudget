import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';
import { ParseSqlServerGuidPipe } from '../../common/validation/sql-server-guid';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTransactionsDto,
  ) {
    return this.transactionsService.findAll(user.userId, query);
  }

  @Get(':transactionId')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('transactionId', ParseSqlServerGuidPipe) transactionId: string,
  ) {
    return this.transactionsService.findOne(user.userId, transactionId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(
      user.userId,
      user.platform,
      idempotencyKey?.slice(0, 120) || randomUUID(),
      dto,
    );
  }

  @Patch(':transactionId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('transactionId', ParseSqlServerGuidPipe) transactionId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(
      user.userId,
      user.platform,
      transactionId,
      dto,
    );
  }

  @Delete(':transactionId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('transactionId', ParseSqlServerGuidPipe) transactionId: string,
  ) {
    return this.transactionsService.remove(
      user.userId,
      user.platform,
      transactionId,
    );
  }
}
