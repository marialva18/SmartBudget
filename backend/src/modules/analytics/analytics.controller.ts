import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.summary(user.userId, query);
  }

  @Get('by-category')
  byCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.byCategory(user.userId, query);
  }

  @Get('by-account')
  byAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.byAccount(user.userId, query);
  }

  @Get('timeline')
  timeline(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.timeline(user.userId, query);
  }

  @Get('top-expenses')
  topExpenses(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.topExpenses(user.userId, query);
  }

  @Get('export')
  async export(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsQueryDto,
    @Res() response: Response,
  ) {
    const file = await this.analyticsService.exportWorkbook(user.userId, query);

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    response.send(file.buffer);
  }
}
