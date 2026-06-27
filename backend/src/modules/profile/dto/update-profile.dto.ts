import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { es } from '../../../common/i18n/es';

export const PROFILE_CURRENCIES = ['PEN', 'USD'] as const;
export const PROFILE_THEMES = ['LIGHT', 'DARK', 'SYSTEM'] as const;
export const HIGH_EXPENSE_WARNING_PERCENTAGES = [30, 50, 70] as const;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[\p{L}\s'-]+$/u, {
    message: es.validation.personName,
  })
  displayName?: string;

  @IsOptional()
  @IsIn(PROFILE_CURRENCIES)
  preferredCurrency?: (typeof PROFILE_CURRENCIES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsIn(PROFILE_THEMES)
  theme?: (typeof PROFILE_THEMES)[number];

  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean;

  @IsOptional()
  @IsIn(HIGH_EXPENSE_WARNING_PERCENTAGES)
  highExpenseWarningPercent?: (typeof HIGH_EXPENSE_WARNING_PERCENTAGES)[number];
}