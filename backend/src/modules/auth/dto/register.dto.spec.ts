import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('rejects a display name containing numbers', async () => {
    const dto = plainToInstance(RegisterDto, {
      displayName: 'María 123',
      email: 'maria@example.com',
      password: 'Seguro123!',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'displayName')).toBe(true);
  });

  it('accepts a valid person name', async () => {
    const dto = plainToInstance(RegisterDto, {
      displayName: 'María de Jesús',
      email: 'maria@example.com',
      password: 'Seguro123!',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects a display name containing only spaces', async () => {
    const dto = plainToInstance(RegisterDto, {
      displayName: '   ',
      email: 'maria@example.com',
      password: 'Seguro123!',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'displayName')).toBe(true);
  });
});
