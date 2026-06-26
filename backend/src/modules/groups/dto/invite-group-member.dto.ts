import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class InviteGroupMemberDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : '',
  )
  @IsEmail()
  email!: string;
}
