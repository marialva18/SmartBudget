import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { es } from '../../../common/i18n/es';
import { IsSqlServerGuid } from '../../../common/validation/sql-server-guid';
import { GROUP_EXPENSE_CURRENCIES } from './create-group-expense.dto';

export class CreateGroupSettlementDto {
  @IsSqlServerGuid({ message: 'Selecciona un miembro válido.' })
  fromMemberId!: string;

  @IsSqlServerGuid({ message: 'Selecciona un miembro válido.' })
  toMemberId!: string;

  @IsSqlServerGuid({ message: 'Selecciona una cuenta válida.' })
  accountId!: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: es.validation.groupSettlementAmountNumber },
  )
  @Min(0.01, { message: es.validation.groupSettlementAmountMinimum })
  @Max(999_999_999_999, {
    message: es.validation.groupSettlementAmountMaximum,
  })
  amount!: number;

  @IsIn(GROUP_EXPENSE_CURRENCIES)
  currency!: (typeof GROUP_EXPENSE_CURRENCIES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(250)
  note?: string;

  @IsOptional()
  @IsISO8601()
  settledAt?: string;
}
