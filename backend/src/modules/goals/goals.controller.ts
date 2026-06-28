import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { WriteThrottle } from '../../common/rate-limit/rate-limit.decorators';
import { CreateGoalDto } from './dto/create-goal.dto';
import { CreateGoalReservationDto } from './dto/create-goal-reservation.dto';
import { ListGoalsDto } from './dto/list-goals.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalsService } from './goals.service';
import { ParseSqlServerGuidPipe } from '../../common/validation/sql-server-guid';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListGoalsDto,
  ) {
    return this.goalsService.findAll(user.userId, query);
  }

  @WriteThrottle()
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(user.userId, user.platform, dto);
  }

  @WriteThrottle()
  @Patch(':goalId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseSqlServerGuidPipe) goalId: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(user.userId, user.platform, goalId, dto);
  }

  @WriteThrottle()
  @Patch(':goalId/complete')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseSqlServerGuidPipe) goalId: string,
  ) {
    return this.goalsService.complete(user.userId, user.platform, goalId);
  }

  @WriteThrottle()
  @Patch(':goalId/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseSqlServerGuidPipe) goalId: string,
  ) {
    return this.goalsService.cancel(user.userId, user.platform, goalId);
  }

  @WriteThrottle()
  @Delete(':goalId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseSqlServerGuidPipe) goalId: string,
  ) {
    return this.goalsService.remove(user.userId, user.platform, goalId);
  }

  @WriteThrottle()
  @Post(':goalId/reservations')
  reserve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseSqlServerGuidPipe) goalId: string,
    @Body() dto: CreateGoalReservationDto,
  ) {
    return this.goalsService.reserve(user.userId, user.platform, goalId, dto);
  }

  @WriteThrottle()
  @Patch(':goalId/reservations/:reservationId/reverse')
  reverseReservation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseSqlServerGuidPipe) goalId: string,
    @Param('reservationId', ParseSqlServerGuidPipe) reservationId: string,
  ) {
    return this.goalsService.reverseReservation(
      user.userId,
      user.platform,
      goalId,
      reservationId,
    );
  }
}
