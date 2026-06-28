import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { WriteThrottle } from '../../common/rate-limit/rate-limit.decorators';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateOnboardingObjectivesDto } from './dto/update-onboarding-objectives.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  findOne(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.findOne(user.userId);
  }

  @WriteThrottle()
  @Patch()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.update(user.userId, user.platform, dto);
  }

  @WriteThrottle()
  @Post('objectives')
  updateObjectives(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOnboardingObjectivesDto,
  ) {
    return this.profileService.updateObjectives(
      user.userId,
      user.platform,
      dto,
    );
  }

  @WriteThrottle()
  @Post('complete-onboarding')
  completeOnboarding(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.completeOnboarding(user.userId, user.platform);
  }

  @WriteThrottle()
  @Delete('account')
  deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.profileService.deleteAccount(user.userId, user.platform, dto);
  }
}
