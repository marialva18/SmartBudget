import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { ListBudgetsDto } from './dto/list-budgets.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListBudgetsDto,
  ) {
    return this.budgetsService.findAll(user.userId, query);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(user.userId, user.platform, dto);
  }

  @Patch(':budgetId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('budgetId', ParseUUIDPipe) budgetId: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(
      user.userId,
      budgetId,
      user.platform,
      dto,
    );
  }
}
