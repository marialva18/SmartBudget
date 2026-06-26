import { IsIn, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { es } from '../../../common/i18n/es';

export class CalendarMonthDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-01$/, {
    message: es.validation.monthStart,
  })
  monthStart?: string;

  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: 'PEN' | 'USD';

  @IsOptional()
  @IsUUID()
  accountId?: string;
}