import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsIn(['INCOME', 'EXPENSE'])
  type!: 'INCOME' | 'EXPENSE';

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  @Max(999_999_999_999)
  amount!: number;

  @IsUUID()
  accountId!: string;

  @IsUUID()
  categoryId!: string;

  @Type(() => Date)
  @IsDate()
  occurredAt!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;
}
