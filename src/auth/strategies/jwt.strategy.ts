import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.interface';
import { UserService } from '../../user/user.service';
import type { Request } from 'express';

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

    async validate(payload: JwtPayload) {
        const user = await this.userService.findById(payload.sub);
        if (!user) throw new UnauthorizedException('존재하지 않는 유저');
        return { userId: user.id, username: user.username };
    }
}
