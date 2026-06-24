import { Injectable } from '@nestjs/common';
import { LeaderboardRepository } from './leaderboard.repository';
import { SoloLeaderboardResponseDto } from './dto/solo-leaderboard-response.dto';
import { StreakLeaderboardResponseDto } from './dto/streak-leaderboard-response.dto';

const MAX_SIZE = 100;

@Injectable()
export class LeaderboardService {
    constructor(private readonly leaderboardRepository: LeaderboardRepository) {}

    async getSoloLeaderboard(
        userId: number | null,
        language: string | undefined,
        page: number,
        size: number,
    ): Promise<SoloLeaderboardResponseDto> {
        const clampedSize = Math.min(size, MAX_SIZE);

        const [rows, myRank] = await Promise.all([
            this.leaderboardRepository.getSoloLeaderboard(language, page, clampedSize),
            userId ? this.leaderboardRepository.getMySoloRank(userId, language) : Promise.resolve(null),
        ]);

        return SoloLeaderboardResponseDto.from(rows, page, clampedSize, userId, myRank);
    }

    async getStreakLeaderboard(
        userId: number | null,
        page: number,
        size: number,
    ): Promise<StreakLeaderboardResponseDto> {
        const clampedSize = Math.min(size, MAX_SIZE);

        const [rows, myRank] = await Promise.all([
            this.leaderboardRepository.getStreakLeaderboard(page, clampedSize),
            userId ? this.leaderboardRepository.getMyStreakRank(userId) : Promise.resolve(null),
        ]);

        return StreakLeaderboardResponseDto.from(rows, page, clampedSize, userId, myRank);
    }
}
