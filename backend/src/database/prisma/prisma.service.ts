import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const MAX_CONNECT_ATTEMPTS = 8;
const CONNECT_RETRY_DELAY_MS = 5_000;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connectWithRetry() {
    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt += 1) {
      try {
        await this.$connect();

        if (attempt > 1) {
          this.logger.log('Database connection established after retry.');
        }

        return;
      } catch (error) {
        const canRetry = attempt < MAX_CONNECT_ATTEMPTS;
        const message =
          error instanceof Error ? error.message : 'Unknown database error.';

        if (!canRetry) {
          this.logger.error(
            `Database connection failed after ${attempt} attempts: ${message}`,
          );
          throw error;
        }

        this.logger.warn(
          `Database connection attempt ${attempt} failed. Retrying in ${
            CONNECT_RETRY_DELAY_MS / 1000
          }s.`,
        );
        await delay(CONNECT_RETRY_DELAY_MS);
      }
    }
  }
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
