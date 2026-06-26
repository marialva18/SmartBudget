import { IsIn, IsOptional } from 'class-validator';

export class ListCategoriesDto {
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';

  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED', 'ALL'])
  status: 'ACTIVE' | 'ARCHIVED' | 'ALL' = 'ACTIVE';
}
