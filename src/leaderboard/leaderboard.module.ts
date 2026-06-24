import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardRepository } from './leaderboard.repository';

@Module({
    controllers: [LeaderboardController],
    providers: [LeaderboardService, LeaderboardRepository],
})
export class LeaderboardModule {}
