import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { es } from '../../../common/i18n/es';
import { IsSqlServerGuid } from '../../../common/validation/sql-server-guid';

export class CreateGoalReservationDto {
  @IsSqlServerGuid({ message: 'Selecciona una cuenta válida.' })
  accountId!: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: es.validation.goalReservationAmountNumber },
  )
  @Min(0.01, { message: es.validation.goalReservationAmountMinimum })
  @Max(999_999_999_999, {
    message: es.validation.goalReservationAmountMaximum,
  })
  amount!: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  @IsString()
  @MaxLength(250)
  note?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reservedAt?: Date;
}
