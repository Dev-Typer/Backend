import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    async logout(refreshToken: string): Promise<void> {
        await this.refreshTokenRepository.update(
            { token: refreshToken },
            { isRevoked: true },
        );
    }

    async refresh(refreshToken: string): Promise<string> {
        let payload: JwtPayload;
        try {
            payload = this.jwtService.verify<JwtPayload>(refreshToken);
        } catch {
            throw new UnauthorizedException('유효하지 않은 refresh token');
        }

        const record = await this.refreshTokenRepository.findOne({
            where: { token: refreshToken, isRevoked: false },
        });

        if (!record) {
            throw new UnauthorizedException('존재하지 않거나 폐기된 refresh token');
        }

        if (record.expiresAt < new Date()) {
            throw new UnauthorizedException('만료된 refresh token');
        }

        const user = await this.userService.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedException('유저를 찾을 수 없음');
        }

        return this.issueAccessToken(user);
    }
}
