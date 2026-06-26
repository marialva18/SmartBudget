import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma/prisma.service';

describe('AppModule', () => {
  it('resolves the application security providers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        userSession: {
          findFirst: jest.fn(),
        },
      })
      .compile();

    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
