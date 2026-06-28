import { IsIn, IsOptional } from 'class-validator';

export class ListRecurringSchedulesDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'PAUSED', 'CANCELLED'])
  status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED';

  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'])
  operationType?: 'INCOME' | 'EXPENSE';
}
