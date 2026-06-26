import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { es } from '../../../common/i18n/es';

export const BUDGET_CURRENCIES = ['PEN', 'USD'] as const;

export class CreateBudgetDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: es.validation.budgetAmountNumber },
  )
  @Min(0.01, { message: es.validation.budgetAmountMinimum })
  @Max(999_999_999_999, { message: es.validation.budgetAmountMaximum })
  amount!: number;

  @IsIn(BUDGET_CURRENCIES)
  currency!: (typeof BUDGET_CURRENCIES)[number];

  @IsString()
  @Matches(/^\d{4}-\d{2}-01$/, {
    message: es.validation.monthStart,
  })
  monthStart!: string;
}
