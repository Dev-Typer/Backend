import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DailyChallengeService } from './daily-challenge.service';

@Injectable()
export class DailyChallengeScheduler {
    constructor(
        private readonly dailyChallengeService: DailyChallengeService,
    ) {}

    // UTC 자정 = KST 09:00 에 실행
    @Cron('0 0 * * *')
    async runDailyJob(): Promise<void> {
        await this.dailyChallengeService.selectNextSnippet();
    }
}
