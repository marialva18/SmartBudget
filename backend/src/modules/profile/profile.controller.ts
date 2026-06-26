import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
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

  @Patch()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.update(user.userId, user.platform, dto);
  }

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

  @Post('complete-onboarding')
  completeOnboarding(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.completeOnboarding(user.userId, user.platform);
  }
}
