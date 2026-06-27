import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
   return 'SmartBudget API is running';
  }
}
