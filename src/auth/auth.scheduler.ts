import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entity/refresh-token.entity';

@Injectable()
export class AuthScheduler {
    private readonly logger = new Logger(AuthScheduler.name);

    constructor(
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupExpiredTokens(): Promise<void> {
        try {
            const result = await this.refreshTokenRepository
                .createQueryBuilder()
                .delete()
                .where('expiresAt < :now OR isRevoked = true', { now: new Date() })
                .execute();

            this.logger.log(`refresh token 정리 완료: ${result.affected}건 삭제`);
        } catch (error) {
            this.logger.error('refresh token 정리 실패', error);
        }
    }
}
