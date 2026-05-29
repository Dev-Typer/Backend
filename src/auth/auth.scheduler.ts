import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from './entity/refresh-token.entity';

@Injectable()
export class AuthScheduler {
    constructor(
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupExpiredTokens(): Promise<void> {
        await this.refreshTokenRepository.delete({ expiresAt: LessThan(new Date()) });
        await this.refreshTokenRepository.delete({ isRevoked: true });
    }
}
