import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { es } from '../../../common/i18n/es';

export class AdjustBalanceDto {
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: es.validation.openingBalanceNumber },
  )
  @Min(0, { message: es.validation.openingBalanceMinimum })
  @Max(999_999_999_999, {
    message: es.validation.openingBalanceMaximum,
  })
  actualBalance!: number;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  note?: string;
}
