import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { BusinessException } from '../common/exceptions/business.exception';
import { AuthError } from '../common/exceptions/error-code';
import { UserRepository } from 'src/user/user.repository';
import { User } from 'src/user/user.entity';
import { GithubProfileDto } from './dto/github-profile.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload.interface';
import { AuthRepository } from './auth.repository';
import jwtConfig from '../config/jwt.config';

@Injectable()
export class AuthService {
    constructor(
        private userRepository: UserRepository,
        private jwtService: JwtService,
        private readonly authRepository: AuthRepository,

        @Inject(jwtConfig.KEY)
        private readonly jwtConf: ConfigType<typeof jwtConfig>,
    ) {}

    async findOrCreateUser(profile: GithubProfileDto): Promise<User> {
        let user = await this.userRepository.findByGithubId(profile.githubId);
        if (!user) {
            user = await this.userRepository.create(profile);
        } else if (!user.profileUrl && profile.avatarUrl) {
            await this.userRepository.updateProfileUrl(user.id, profile.avatarUrl);
            user.profileUrl = profile.avatarUrl;
        }
        return user;
    }

    issueAccessToken(user: Pick<User, 'id' | 'username' | 'role'>): string {
        const payload: JwtPayload = { sub: user.id, username: user.username, role: user.role };
        return this.jwtService.sign(payload, { expiresIn: this.jwtConf.accessExpiresSeconds });
    }

    async issueRefreshToken(user: Pick<User, 'id' | 'username' | 'role'>): Promise<string> {
        const payload: JwtPayload = { sub: user.id, username: user.username, role: user.role };
        const token = this.jwtService.sign(payload, { expiresIn: this.jwtConf.refreshExpiresSeconds });

        const expiresAt = new Date(Date.now() + this.jwtConf.refreshExpiresSeconds * 1000);

        await this.authRepository.revokeAndSave(user.id, token, expiresAt);

        return token;
    }

    async issueTokens(user: Pick<User, 'id' | 'username' | 'role'>): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = this.issueAccessToken(user);
        const refreshToken = await this.issueRefreshToken(user);
        return { accessToken, refreshToken };
    }

    async logout(refreshToken: string, userId: number): Promise<void> {
        await this.authRepository.revokeByTokenAndUser(refreshToken, userId);
    }

    async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            this.jwtService.verify<JwtPayload>(refreshToken);
        } catch {
            throw new BusinessException(AuthError.INVALID_REFRESH_TOKEN);
        }

        const record = await this.authRepository.findValid(refreshToken);

        if (!record) {
            throw new BusinessException(AuthError.REVOKED_REFRESH_TOKEN);
        }

        if (record.expiresAt < new Date()) {
            throw new BusinessException(AuthError.EXPIRED_REFRESH_TOKEN);
        }

        const user = await this.userRepository.findById(record.userId);
        if (!user) throw new BusinessException(AuthError.USER_NOT_FOUND);

        return this.issueTokens(user);
    }
}
