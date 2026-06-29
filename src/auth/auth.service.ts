import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { BusinessException } from '../common/exceptions/business.exception';
import { AuthError } from '../common/exceptions/error-code';
import { UserRepository } from 'src/user/user.repository';
import { User } from 'src/user/user.entity';
import { GithubProfileDto } from './dto/github-profile.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload.interface';
import { AuthRepository } from './auth.repository';
import { AuthMeResponseDto } from './dto/auth-me-response.dto';
import jwtConfig from '../config/jwt.config';

@Injectable()
export class AuthService {
    // ⚠️ 단일 인스턴스 한정 — 수평 스케일아웃 시 Redis로 교체 필요
    private readonly oauthCodes = new Map<string, { accessToken: string; expiresAt: number }>();

    constructor(
        private userRepository: UserRepository,
        private jwtService: JwtService,
        private readonly authRepository: AuthRepository,

        @Inject(jwtConfig.KEY)
        private readonly jwtConf: ConfigType<typeof jwtConfig>,
    ) {}

    generateOAuthCode(accessToken: string): string {
        const code = randomUUID();
        this.oauthCodes.set(code, { accessToken, expiresAt: Date.now() + 30_000 });
        return code;
    }

    consumeOAuthCode(code: string): string | null {
        const entry = this.oauthCodes.get(code);
        this.oauthCodes.delete(code);
        if (!entry || entry.expiresAt < Date.now()) return null;
        return entry.accessToken;
    }

    async getAuthMe(userId: number): Promise<AuthMeResponseDto> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new BusinessException(AuthError.USER_NOT_FOUND);
        return AuthMeResponseDto.from(user);
    }

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
