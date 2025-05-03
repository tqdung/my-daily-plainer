// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception.message;

    const errorResponse =
      typeof message === 'object'
        ? {
            statusCode: status,
            message: (message as any).message || (message as any),
            error: (message as any).error || exception.name,
            timestamp: new Date().toISOString(),
            path: request.url,
          }
        : {
            statusCode: status,
            message,
            error: exception.name,
            timestamp: new Date().toISOString(),
            path: request.url,
          };

    this.logger.error(`[${request.method}] ${request.url}`, exception.stack);
    response.status(status).json(errorResponse);
  }
}
