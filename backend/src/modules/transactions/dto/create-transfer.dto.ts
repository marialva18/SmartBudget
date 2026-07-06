import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsSqlServerGuid } from '../../../common/validation/sql-server-guid';

export class CreateTransferDto {
  @IsSqlServerGuid({ message: 'Selecciona la cuenta de origen.' })
  fromAccountId!: string;

  @IsSqlServerGuid({ message: 'Selecciona la cuenta de destino.' })
  toAccountId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  @Max(999_999_999_999)
  amount!: number;

  @Type(() => Date)
  @IsDate()
  occurredAt!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;
}
