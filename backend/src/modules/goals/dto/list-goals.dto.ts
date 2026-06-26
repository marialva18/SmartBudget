import { IsIn, IsOptional } from 'class-validator';
import { GOAL_CURRENCIES } from './create-goal.dto';

export class ListGoalsDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

  @IsOptional()
  @IsIn(GOAL_CURRENCIES)
  currency?: (typeof GOAL_CURRENCIES)[number];
}
