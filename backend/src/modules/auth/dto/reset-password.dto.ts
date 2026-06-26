import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { es } from '../../../common/i18n/es';

export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: es.validation.password,
  })
  password!: string;
}
