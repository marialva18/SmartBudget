import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsSqlServerGuid } from '../../../common/validation/sql-server-guid';

export const RECURRING_OPERATION_TYPES = ['INCOME', 'EXPENSE'] as const;
export const RECURRING_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;

export class CreateRecurringScheduleDto {
  @IsIn(RECURRING_OPERATION_TYPES, {
    message: 'Selecciona un tipo de recurrencia válido.',
  })
  operationType!: (typeof RECURRING_OPERATION_TYPES)[number];

  @IsSqlServerGuid({ message: 'Selecciona una cuenta válida.' })
  accountId!: string;

  @IsSqlServerGuid({ message: 'Selecciona una categoría válida.' })
  categoryId!: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'El monto debe ser un número válido.' },
  )
  @Min(0.0001, { message: 'El monto debe ser mayor que cero.' })
  @Max(999_999_999_999, {
    message: 'El monto supera el máximo permitido.',
  })
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(250, {
    message: 'La descripción no puede superar los 250 caracteres.',
  })
  description?: string;

  @IsIn(RECURRING_FREQUENCIES, {
    message: 'Selecciona una frecuencia válida.',
  })
  frequency!: (typeof RECURRING_FREQUENCIES)[number];

  @Type(() => Number)
  @IsInt({ message: 'El intervalo debe ser un número entero.' })
  @Min(1, { message: 'El intervalo mínimo es 1.' })
  @Max(12, { message: 'El intervalo máximo es 12.' })
  intervalCount!: number;

  @Type(() => Date)
  @IsDate({ message: 'Selecciona una fecha de inicio válida.' })
  startsOn!: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Selecciona una fecha de fin válida.' })
  endsOn?: Date;
}