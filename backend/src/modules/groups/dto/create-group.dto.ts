import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { es } from '../../../common/i18n/es';

export class CreateGroupDto {
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : '',
  )
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[\p{L}\d\s'-]+$/u, {
    message: es.validation.groupName,
  })
  name!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  @MaxLength(500)
  description?: string;
}
