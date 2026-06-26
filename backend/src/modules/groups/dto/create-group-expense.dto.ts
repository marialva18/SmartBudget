import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { es } from '../../../common/i18n/es';

export const GROUP_EXPENSE_CURRENCIES = ['PEN', 'USD'] as const;

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

  @IsUUID()
  paidByMemberId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
participantMemberIds!: string[];

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
