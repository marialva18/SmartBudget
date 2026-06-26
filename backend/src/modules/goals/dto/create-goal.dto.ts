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

export const GOAL_CURRENCIES = ['PEN', 'USD'] as const;

export class CreateGoalDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : '',
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[\p{L}\d\s'-]+$/u, {
    message: es.validation.goalName,
  })
  name!: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: es.validation.goalAmountNumber },
  )
  @Min(0.01, { message: es.validation.goalAmountMinimum })
  @Max(999_999_999_999, { message: es.validation.goalAmountMaximum })
  targetAmount!: number;

  @IsIn(GOAL_CURRENCIES)
  currency!: (typeof GOAL_CURRENCIES)[number];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  targetDate?: Date;
}
