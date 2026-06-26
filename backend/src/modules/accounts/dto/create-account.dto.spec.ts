import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAccountDto } from './create-account.dto';

describe('CreateAccountDto', () => {
  it('rejects an account name containing numbers', async () => {
    const dto = plainToInstance(CreateAccountDto, {
      name: 'Cuenta 123',
      type: 'BANK',
      currency: 'PEN',
      openingBalance: 100,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects a negative opening balance', async () => {
    const dto = plainToInstance(CreateAccountDto, {
      name: 'Cuenta sueldo',
      type: 'BANK',
      currency: 'PEN',
      openingBalance: -1,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'openingBalance')).toBe(
      true,
    );
  });

  it('rejects a name containing only spaces', async () => {
    const dto = plainToInstance(CreateAccountDto, {
      name: '   ',
      type: 'BANK',
      currency: 'PEN',
      openingBalance: 0,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('accepts letters with accents, apostrophes and hyphens', async () => {
    const dto = plainToInstance(CreateAccountDto, {
      name: 'Ahorro María-José',
      type: 'BANK',
      currency: 'PEN',
      openingBalance: 0,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
