import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional } from 'class-validator';
import { IsSqlServerGuid } from '../../../common/validation/sql-server-guid';

export class AnalyticsQueryDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @IsOptional()
  @IsSqlServerGuid({ message: 'Selecciona una cuenta válida.' })
  accountId?: string;

  @IsOptional()
  @IsSqlServerGuid({ message: 'Selecciona una categoría válida.' })
  categoryId?: string;

  @IsOptional()
  @IsSqlServerGuid({ message: 'Selecciona un grupo válido.' })
  groupId?: string;

  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';

  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: 'PEN' | 'USD';

  @IsOptional()
  @IsIn(['AFFECTS_BALANCE', 'ANALYSIS_ONLY', 'PENDING_FUTURE'])
  balanceImpactStatus?: 'AFFECTS_BALANCE' | 'ANALYSIS_ONLY' | 'PENDING_FUTURE';

  @IsOptional()
  @IsIn(['PREVIOUS_PERIOD', 'PREVIOUS_MONTH', 'PREVIOUS_YEAR', 'NONE'])
  compareWith?: 'PREVIOUS_PERIOD' | 'PREVIOUS_MONTH' | 'PREVIOUS_YEAR' | 'NONE';
}
