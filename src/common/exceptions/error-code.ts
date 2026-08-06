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
  INVALID_OAUTH_CODE: {
    code: 'AUTH_006',
    statusCode: HttpStatus.BAD_REQUEST,
    message: '유효하지 않거나 만료된 OAuth 코드입니다',
  },
} as const satisfies Record<string, ErrorCode>;

export const SnippetError = {
  NOT_FOUND: {
    code: 'SNIPPET_001',
    statusCode: HttpStatus.NOT_FOUND,
    message: '존재하지 않는 스니펫입니다',
  },
  INACTIVE: {
    code: 'SNIPPET_002',
    statusCode: HttpStatus.BAD_REQUEST,
    message: '비활성화된 스니펫입니다',
  },
} as const satisfies Record<string, ErrorCode>;

export const ResultError = {
  INVALID_WPM: {
    code: 'RESULT_001',
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'wpm은 0보다 커야 합니다',
  },
  INVALID_ACCURACY: {
    code: 'RESULT_002',
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'accuracy는 0~100 사이여야 합니다',
  },
  DURATION_TOO_SHORT: {
    code: 'RESULT_003',
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'durationSec은 3초 이상이어야 합니다',
  },
  WPM_TOO_HIGH: {
    code: 'RESULT_004',
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'wpm이 비정상적으로 높습니다',
  },
  NOT_FOUND: {
    code: 'RESULT_005',
    statusCode: HttpStatus.NOT_FOUND,
    message: '존재하지 않는 결과입니다',
  },
  FORBIDDEN: {
    code: 'RESULT_006',
    statusCode: HttpStatus.FORBIDDEN,
    message: '접근 권한이 없습니다',
  },
} as const satisfies Record<string, ErrorCode>;

export const UserError = {
  NOT_FOUND: {
    code: 'USER_001',
    statusCode: HttpStatus.NOT_FOUND,
    message: '존재하지 않는 유저입니다',
  },
  IMAGE_TYPE_NOT_ALLOWED: {
    code: 'USER_002',
    statusCode: HttpStatus.BAD_REQUEST,
    message: '허용되지 않는 이미지 타입입니다',
  },
  IMAGE_TOO_LARGE: {
    code: 'USER_003',
    statusCode: HttpStatus.BAD_REQUEST,
    message: '이미지 크기가 초과되었습니다',
  },
} as const satisfies Record<string, ErrorCode>;

export const DailyError = {
  NOT_FOUND: {
    code: 'DAILY_001',
    statusCode: HttpStatus.NOT_FOUND,
    message: '오늘의 챌린지가 존재하지 않습니다',
  },
} as const satisfies Record<string, ErrorCode>;

export const BadgeError = {
  DISPLAY_LIMIT_EXCEEDED: {
    code: 'BADGE_001',
    statusCode: HttpStatus.BAD_REQUEST,
    message: '표시 뱃지는 최대 8개까지 선택 가능합니다.',
  },
  NOT_OWNED: {
    code: 'BADGE_002',
    statusCode: HttpStatus.BAD_REQUEST,
    message: '보유하지 않은 뱃지입니다.',
  },
  DUPLICATE_CODE: {
    code: 'BADGE_003',
    statusCode: HttpStatus.BAD_REQUEST,
    message: '중복된 뱃지 코드가 있습니다.',
  },
} as const satisfies Record<string, ErrorCode>;
