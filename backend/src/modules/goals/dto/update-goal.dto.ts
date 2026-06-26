import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { es } from '../../../common/i18n/es';
import { GOAL_CURRENCIES } from './create-goal.dto';

export class UpdateGoalDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : '',
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[\p{L}\d\s'-]+$/u, {
    message: es.validation.goalName,
  })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: es.validation.goalAmountNumber },
  )
  @Min(0.01, { message: es.validation.goalAmountMinimum })
  @Max(999_999_999_999, { message: es.validation.goalAmountMaximum })
  targetAmount?: number;

  @IsOptional()
  @IsIn(GOAL_CURRENCIES)
  currency?: (typeof GOAL_CURRENCIES)[number];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  targetDate?: Date;
}
