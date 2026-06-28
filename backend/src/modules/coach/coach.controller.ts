import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CoachThrottle } from '../../common/rate-limit/rate-limit.decorators';
import { CoachService } from './coach.service';
import { SendCoachMessageDto } from './dto/send-coach-message.dto';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get('usage')
  getUsage(@CurrentUser() user: AuthenticatedUser) {
    return this.coachService.getUsage(user.userId);
  }

  @CoachThrottle()
  @Post('message')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendCoachMessageDto,
  ) {
    return this.coachService.sendMessage(user.userId, user.platform, dto);
  }
}
