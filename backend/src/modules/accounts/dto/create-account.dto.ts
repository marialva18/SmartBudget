import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { es } from '../../../common/i18n/es';

export const ACCOUNT_TYPES = ['CASH', 'BANK', 'DIGITAL_WALLET'] as const;
export const ACCOUNT_CURRENCIES = ['PEN', 'USD'] as const;

export class CreateAccountDto {
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : '',
  )
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[\p{L}\s'-]+$/u, {
    message: es.validation.accountName,
  })
  name!: string;

  @IsIn(ACCOUNT_TYPES)
  type!: (typeof ACCOUNT_TYPES)[number];

  @IsIn(ACCOUNT_CURRENCIES)
  currency!: (typeof ACCOUNT_CURRENCIES)[number];

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: es.validation.openingBalanceNumber },
  )
  @Min(0, { message: es.validation.openingBalanceMinimum })
  @Max(999_999_999_999, {
    message: es.validation.openingBalanceMaximum,
  })
  openingBalance!: number;
}
