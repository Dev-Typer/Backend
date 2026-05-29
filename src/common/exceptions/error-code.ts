import { HttpStatus } from '@nestjs/common';

export interface ErrorCode {
  code: string;
  statusCode: HttpStatus;
  message: string;
}

export const AuthError = {
  INVALID_TOKEN: {
    code: 'AUTH_001',
    statusCode: HttpStatus.UNAUTHORIZED,
    message: '유효하지 않은 토큰입니다',
  },
  EXPIRED_TOKEN: {
    code: 'AUTH_002',
    statusCode: HttpStatus.UNAUTHORIZED,
    message: '만료된 토큰입니다',
  },
  UNAUTHORIZED: {
    code: 'AUTH_003',
    statusCode: HttpStatus.UNAUTHORIZED,
    message: '로그인이 필요합니다',
  },
} as const satisfies Record<string, ErrorCode>;

export const UserError = {
  NOT_FOUND: {
    code: 'USER_001',
    statusCode: HttpStatus.NOT_FOUND,
    message: '유저를 찾을 수 없습니다',
  },
  DUPLICATE_USERNAME: {
    code: 'USER_002',
    statusCode: HttpStatus.CONFLICT,
    message: '이미 사용 중인 닉네임입니다',
  },
} as const satisfies Record<string, ErrorCode>;
// 위 모든 내용은 임시입니다 하지만 양식은 동일하게 유지해주세요