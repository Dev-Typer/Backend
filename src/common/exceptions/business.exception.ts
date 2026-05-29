import { HttpException } from '@nestjs/common';
import { ErrorCode } from './error-code';

export class BusinessException extends HttpException {
  constructor(private readonly errorCode: ErrorCode) {
    super(errorCode.message, errorCode.statusCode);
  }

  getErrorCode(): ErrorCode {
    return this.errorCode;
  }
}