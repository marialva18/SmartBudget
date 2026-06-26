import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { es } from '../i18n/es';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const requestId = this.getRequestId(request);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ??
            es.system.requestFailed);

      response.status(status).json({
        statusCode: status,
        message,
        requestId,
      });
      return;
    }

    this.logger.error(
      `Unhandled error ${request.method} ${request.url} requestId=${requestId}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: es.system.genericError,
      requestId,
    });
  }

  private getRequestId(request: Request): string {
    const header = request.headers['x-request-id'];
    return typeof header === 'string' && header.length <= 100
      ? header
      : randomUUID();
  }
}
