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

export class UpdateTransactionDto {
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  @Max(999_999_999_999)
  amount?: number;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;
}
