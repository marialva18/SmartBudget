import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';
import { es } from '../../../common/i18n/es';

export class UpdateBudgetDto {
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: es.validation.budgetAmountNumber },
  )
  @Min(0.01, { message: es.validation.budgetAmountMinimum })
  @Max(999_999_999_999, { message: es.validation.budgetAmountMaximum })
  amount!: number;
}
