import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from './entity/refresh-token.entity';

@Injectable()
export class AuthRepository {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly repo: Repository<RefreshToken>,
        private readonly dataSource: DataSource,
    ) {}

    // 기존 토큰 revoke 후 새 토큰 저장 — 트랜잭션 처리
    async revokeAndSave(userId: number, token: string, expiresAt: Date): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            await manager.update(RefreshToken, { userId, isRevoked: false }, { isRevoked: true });
            await manager.save(
                RefreshToken,
                manager.create(RefreshToken, { token, expiresAt, userId, isRevoked: false }),
            );
        });
    }

    async revokeByTokenAndUser(token: string, userId: number): Promise<void> {
        await this.repo.update({ token, userId }, { isRevoked: true });
    }

    async findValid(token: string): Promise<RefreshToken | null> {
        return this.repo.findOne({ where: { token, isRevoked: false } });
    }
}
