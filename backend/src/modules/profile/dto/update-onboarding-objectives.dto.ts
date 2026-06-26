import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
} from 'class-validator';

export const ONBOARDING_OBJECTIVES = [
  'SAVE',
  'CONTROL_EXPENSES',
  'ORGANIZE_INCOME',
  'CREATE_BUDGET',
] as const;

export class UpdateOnboardingObjectivesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsIn(ONBOARDING_OBJECTIVES, { each: true })
  objectives!: Array<(typeof ONBOARDING_OBJECTIVES)[number]>;
}
