import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { es } from '../../../common/i18n/es';
import { IsSqlServerGuid } from '../../../common/validation/sql-server-guid';

export const GROUP_EXPENSE_CURRENCIES = ['PEN', 'USD'] as const;
export const GROUP_SPLIT_MODES = [
  'EQUAL',
  'CUSTOM_AMOUNTS',
  'PERCENTAGES',
] as const;

export class GroupExpenseSplitDto {
  @IsSqlServerGuid({ message: 'Selecciona un miembro válido.' })
  memberId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.01)
  @Max(999_999_999_999)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.01)
  @Max(100)
  percentage?: number;
}

export class CreateGroupExpenseDto {
  @IsString()
  @MaxLength(250)
  @Matches(/^[\p{L}\d\s.,'()-]+$/u, {
    message: es.validation.groupExpenseDescription,
  })
  description!: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: es.validation.groupExpenseAmountNumber },
  )
  @Min(0.01, { message: es.validation.groupExpenseAmountMinimum })
  @Max(999_999_999_999, {
    message: es.validation.groupExpenseAmountMaximum,
  })
  amount!: number;

  @IsIn(GROUP_EXPENSE_CURRENCIES)
  currency!: (typeof GROUP_EXPENSE_CURRENCIES)[number];

  @IsSqlServerGuid({ message: 'Selecciona un miembro válido.' })
  paidByMemberId!: string;

  @IsSqlServerGuid({ message: 'Selecciona una cuenta válida.' })
  accountId!: string;

  @IsOptional()
  @IsIn(GROUP_SPLIT_MODES)
  splitMode?: (typeof GROUP_SPLIT_MODES)[number];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsSqlServerGuid({
    each: true,
    message: 'Selecciona participantes válidos.',
  })
  participantMemberIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GroupExpenseSplitDto)
  splits?: GroupExpenseSplitDto[];

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
