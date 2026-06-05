import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.interface';
import { UserService } from '../../user/user.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AuthError } from '../../common/exceptions/error-code';
import type { Request } from 'express';
import { JwtUser } from '../../common/types/jwt-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        private userService: UserService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => req?.cookies?.accessToken ?? null,
            ]),
            secretOrKey: config.get<string>('JWT_SECRET')!,
        });
    }

    async validate(payload: JwtPayload): Promise<JwtUser> {
        const user = await this.userService.findById(payload.sub);
        if (!user) throw new BusinessException(AuthError.USER_NOT_FOUND);
        return { userId: user.id, username: user.username, role: user.role };
    }
}
