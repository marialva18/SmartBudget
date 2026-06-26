import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { es } from '../../../common/i18n/es';

export class DashboardSummaryDto {
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: 'PEN' | 'USD';

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-01$/, {
    message: es.validation.monthStart,
  })
  monthStart?: string;
}
