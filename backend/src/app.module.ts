import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { validateEnvironment } from './config/environment';
import { PrismaModule } from './database/prisma/prisma.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CoachModule } from './modules/coach/coach.module';
import { GoalsModule } from './modules/goals/goals.module';
import { GroupsModule } from './modules/groups/groups.module';
import { HealthModule } from './modules/health/health.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { RecurringModule } from './modules/recurring/recurring.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    AccountsModule,
    CategoriesModule,
    BudgetsModule,
    GoalsModule,
    GroupsModule,
    DashboardModule,
    CoachModule,
    CalendarModule,
    ProfileModule,
    RecurringModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
