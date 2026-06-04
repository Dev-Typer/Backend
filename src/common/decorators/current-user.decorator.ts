import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../types/jwt-user.type';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtUser | null => {
    if (ctx.getType() !== 'http') {
      throw new Error('CurrentUser decorator는 HTTP context 전용입니다.');
    }
    return (ctx.switchToHttp().getRequest().user as JwtUser) ?? null;
  },
);
