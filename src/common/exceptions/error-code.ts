import { HttpStatus } from '@nestjs/common';

export interface ErrorCode {
  code: string;
  statusCode: HttpStatus;
  message: string;
}

export const AuthError = {
  MISSING_REFRESH_TOKEN: {
    code: 'AUTH_001',
    statusCode: HttpStatus.UNAUTHORIZED,
    message: 'refresh token이 없습니다',
  },
  INVALID_REFRESH_TOKEN: {
    code: 'AUTH_002',
    statusCode: HttpStatus.UNAUTHORIZED,
    message: '유효하지 않은 refresh token입니다',
  },
  REVOKED_REFRESH_TOKEN: {
    code: 'AUTH_003',
    statusCode: HttpStatus.UNAUTHORIZED,
    message: '폐기된 refresh token입니다',
  },
  EXPIRED_REFRESH_TOKEN: {
    code: 'AUTH_004',
    statusCode: HttpStatus.UNAUTHORIZED,
    message: '만료된 refresh token입니다',
  },
  USER_NOT_FOUND: {
    code: 'AUTH_005',
    statusCode: HttpStatus.UNAUTHORIZED,
    message: '존재하지 않는 유저입니다',
  },
} as const satisfies Record<string, ErrorCode>;

export const SnippetError = {
  NOT_FOUND: {
    code: 'SNIPPET_001',
    statusCode: HttpStatus.NOT_FOUND,
    message: '존재하지 않는 스니펫입니다',
  },
} as const satisfies Record<string, ErrorCode>;
