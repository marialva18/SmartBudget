import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendCoachMessageDto {
  @IsString()
  @MinLength(3, {
    message: 'Escribe una pregunta un poco más clara para el coach.',
  })
  @MaxLength(500, {
    message: 'Tu pregunta no puede superar los 500 caracteres.',
  })
  message!: string;
}