import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsSqlServerGuid } from '../../../common/validation/sql-server-guid';

export class CreateTransactionDto {
  @IsIn(['INCOME', 'EXPENSE'])
  type!: 'INCOME' | 'EXPENSE';

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  @Max(999_999_999_999)
  amount!: number;

  @IsSqlServerGuid({ message: 'Selecciona una cuenta válida.' })
  accountId!: string;

  @IsSqlServerGuid({ message: 'Selecciona una categoría válida.' })
  categoryId!: string;

  @Type(() => Date)
  @IsDate()
  occurredAt!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;
}