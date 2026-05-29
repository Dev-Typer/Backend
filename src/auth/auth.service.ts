import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';
import { GithubProfileDto } from './dto/github-profile.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entity/refresh-token.entity';
import { DataSource, Repository } from 'typeorm';
import jwtConfig from '../config/jwt.config';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private dataSource: DataSource,

        @Inject(jwtConfig.KEY)
        private readonly jwtConf: ConfigType<typeof jwtConfig>,

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

    issueAccessToken(user: Pick<User, 'id' | 'username'>): string {
        const payload: JwtPayload = { sub: user.id, username: user.username };
        return this.jwtService.sign(payload, { expiresIn: this.jwtConf.accessExpiresSeconds });
    }

    async issueRefreshToken(user: Pick<User, 'id' | 'username'>): Promise<string> {
        const payload: JwtPayload = { sub: user.id, username: user.username };
        const token = this.jwtService.sign(payload, { expiresIn: this.jwtConf.refreshExpiresSeconds });

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + this.jwtConf.refreshExpiresSeconds);

        await this.dataSource.transaction(async (manager) => {
            await manager.update(RefreshToken, { userId: user.id, isRevoked: false }, { isRevoked: true });
            await manager.save(RefreshToken, manager.create(RefreshToken, { token, expiresAt, userId: user.id, isRevoked: false }));
        });

        return token;
    }

    async issueTokens(user: Pick<User, 'id' | 'username'>): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = this.issueAccessToken(user);
        const refreshToken = await this.issueRefreshToken(user);
        return { accessToken, refreshToken };
    }

    async logout(refreshToken: string, userId: number): Promise<void> {
        await this.refreshTokenRepository.update(
            { token: refreshToken, userId },
            { isRevoked: true },
        );
    }

    async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
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

        return this.issueTokens({ id: record.userId, username: payload.username });
    }
}
