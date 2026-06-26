import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DashboardSummaryDto,
  ) {
    return this.dashboardService.summary(user.userId, query);
  }
}
