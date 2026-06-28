import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export const SQL_SERVER_GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function IsSqlServerGuid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSqlServerGuid',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && SQL_SERVER_GUID_REGEX.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser un identificador válido.`;
        },
      },
    });
  };
}

@Injectable()
export class ParseSqlServerGuidPipe implements PipeTransform {
  transform(value: unknown) {
    if (typeof value !== 'string' || !SQL_SERVER_GUID_REGEX.test(value)) {
      throw new BadRequestException('Identificador inválido.');
    }

    return value;
  }
}
