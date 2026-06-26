import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { es } from '../../../common/i18n/es';

export const CATEGORY_TYPES = ['INCOME', 'EXPENSE'] as const;

export class CreateCategoryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : '',
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[\p{L}\s'-]+$/u, {
    message: es.validation.categoryName,
  })
  name!: string;

  @IsIn(CATEGORY_TYPES)
  type!: (typeof CATEGORY_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/)
  icon?: string;
}
