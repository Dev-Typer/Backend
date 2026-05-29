import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ApiResponse } from '../dto/api-response';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof BusinessException) {
      const errorCode = exception.getErrorCode();
      res.status(errorCode.statusCode).json(
        ApiResponse.fail(errorCode.message, errorCode.statusCode, errorCode.code),
      );
      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as Record<string, unknown>).message as string ?? exception.message;

      res.status(statusCode).json(
        ApiResponse.fail(message, statusCode),
      );
      return;
    }

    res.status(500).json(
      ApiResponse.fail('서버 내부 오류가 발생했습니다', HttpStatus.INTERNAL_SERVER_ERROR),
    );
  }
}
