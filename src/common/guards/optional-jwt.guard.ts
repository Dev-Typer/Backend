import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: unknown, user: T): T | null {
    // 토큰 없음 / 만료 / 잘못된 형식 모두 비로그인으로 처리
    return user ?? null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // 토큰 파싱 실패 등 예외도 비로그인으로 처리
    }
    return true;
  }
}
