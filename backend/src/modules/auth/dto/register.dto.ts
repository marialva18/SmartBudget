import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { es } from '../../../common/i18n/es';

export class RegisterDto {
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : '',
  )
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[\p{L}\s'-]+$/u, {
    message: es.validation.personName,
  })
  displayName!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: es.validation.password,
  })
  password!: string;
}
