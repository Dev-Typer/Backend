import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
        const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
        const hasToken = !!req.headers['authorization'];

        // 토큰이 있는데 유효하지 않으면 (만료·위조) → 401
        if (hasToken && (err || !user)) {
            throw err ?? new UnauthorizedException();
        }

        return user ?? null;
    }
}
