import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { WriteThrottle } from '../../common/rate-limit/rate-limit.decorators';
import { ParseSqlServerGuidPipe } from '../../common/validation/sql-server-guid';
import { CreateRecurringScheduleDto } from './dto/create-recurring-schedule.dto';
import { ListRecurringSchedulesDto } from './dto/list-recurring-schedules.dto';
import { RecurringService } from './recurring.service';

@Controller('recurring')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}
  @Get('due')
  findDue(@CurrentUser() user: AuthenticatedUser) {
    return this.recurringService.findDue(user.userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRecurringSchedulesDto,
  ) {
    return this.recurringService.findAll(user.userId, query);
  }

  @WriteThrottle()
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecurringScheduleDto,
  ) {
    return this.recurringService.create(user.userId, user.platform, dto);
  }
  @WriteThrottle()
  @Patch(':scheduleId/confirm')
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('scheduleId', ParseSqlServerGuidPipe) scheduleId: string,
  ) {
    return this.recurringService.confirmDue(
      user.userId,
      user.platform,
      scheduleId,
    );
  }

  @WriteThrottle()
  @Patch(':scheduleId/skip')
  skip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('scheduleId', ParseSqlServerGuidPipe) scheduleId: string,
  ) {
    return this.recurringService.skipDue(
      user.userId,
      user.platform,
      scheduleId,
    );
  }

  @WriteThrottle()
  @Patch(':scheduleId/pause')
  pause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('scheduleId', ParseSqlServerGuidPipe) scheduleId: string,
  ) {
    return this.recurringService.changeStatus(
      user.userId,
      user.platform,
      scheduleId,
      'PAUSED',
    );
  }

  @WriteThrottle()
  @Patch(':scheduleId/resume')
  resume(
    @CurrentUser() user: AuthenticatedUser,
    @Param('scheduleId', ParseSqlServerGuidPipe) scheduleId: string,
  ) {
    return this.recurringService.changeStatus(
      user.userId,
      user.platform,
      scheduleId,
      'ACTIVE',
    );
  }

  @WriteThrottle()
  @Patch(':scheduleId/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('scheduleId', ParseSqlServerGuidPipe) scheduleId: string,
  ) {
    return this.recurringService.changeStatus(
      user.userId,
      user.platform,
      scheduleId,
      'CANCELLED',
    );
  }
}
