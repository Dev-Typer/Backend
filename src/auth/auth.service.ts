import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';
import { GithubProfileDto } from './dto/github-profile.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entity/refresh-token.entity';
import { Repository } from 'typeorm';
@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,

        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
            
    ) {}

    async findOrCreateUser(profile: GithubProfileDto): Promise<User> {
        let user = await this.userService.findByGithubId(profile.githubId);
        if (!user) {
            user = await this.userService.create(profile);
        }
        return user;
    }

    issueAccessToken(user: User): string {
        const payload: JwtPayload = { sub: user.id, username: user.username };
        return this.jwtService.sign(payload, { expiresIn: '15m' });
    }

    async issueRefreshToken(user: User): Promise<string> {
        const payload: JwtPayload = { sub: user.id, username: user.username };
        const token = this.jwtService.sign(payload, { expiresIn: '7d' });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const refreshToken = this.refreshTokenRepository.create({
            token,
            expiresAt,
            userId: user.id,
            isRevoked: false,
        });
        await this.refreshTokenRepository.save(refreshToken);

        return token;
    }

    async issueTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = this.issueAccessToken(user);
        const refreshToken = await this.issueRefreshToken(user);
        return { accessToken, refreshToken };
    }
}
