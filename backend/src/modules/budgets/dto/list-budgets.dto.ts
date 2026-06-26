import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { BUDGET_CURRENCIES } from './create-budget.dto';
import { es } from '../../../common/i18n/es';

export class ListBudgetsDto {
  @IsOptional()
  @IsIn(BUDGET_CURRENCIES)
  currency?: (typeof BUDGET_CURRENCIES)[number];

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-01$/, {
    message: es.validation.monthStart,
  })
  monthStart?: string;
}
