import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';
import { es } from '../../../common/i18n/es';

export class UpdateOpeningBalanceDto {
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