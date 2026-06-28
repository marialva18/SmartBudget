import { IsString, MaxLength, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
