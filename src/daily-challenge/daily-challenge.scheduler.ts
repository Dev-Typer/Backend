import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DailyChallengeService } from './daily-challenge.service';

@Injectable()
export class DailyChallengeScheduler implements OnApplicationBootstrap {
    constructor(
        private readonly dailyChallengeService: DailyChallengeService,
    ) {}

    // 서버 시작 시 당일 챌린지 없으면 즉시 생성
    async onApplicationBootstrap(): Promise<void> {
        await this.dailyChallengeService.selectNextSnippet();
    }

    // UTC 자정 = KST 09:00 에 실행
    @Cron('0 0 * * *', { timeZone: 'UTC' })
    async runDailyJob(): Promise<void> {
        await this.dailyChallengeService.selectNextSnippet();
    }
}
