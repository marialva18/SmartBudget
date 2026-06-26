import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CalendarService } from './calendar.service';
import { CalendarMonthDto } from './dto/calendar-month.dto';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('month')
  month(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CalendarMonthDto,
  ) {
    return this.calendarService.month(user.userId, query);
  }
}