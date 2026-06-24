import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiResponse } from '../common/dto/api-response';
import type { JwtUser } from '../common/types/jwt-user.type';
import { LeaderboardService } from './leaderboard.service';
import type { SoloLeaderboardResponseDto } from './dto/solo-leaderboard-response.dto';
import type { StreakLeaderboardResponseDto } from './dto/streak-leaderboard-response.dto';

@Controller('/api/leaderboard')
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) {}

    @Get('/solo')
    @UseGuards(OptionalJwtAuthGuard)
    async getSoloLeaderboard(
        @CurrentUser() user: JwtUser | null,
        @Query('language') language?: string,
        @Query('page') page = '1',
        @Query('size') size = '50',
    ): Promise<ApiResponse<SoloLeaderboardResponseDto>> {
        const result = await this.leaderboardService.getSoloLeaderboard(
            user?.userId ?? null,
            language || undefined,
            Math.max(1, Number(page)),
            Math.max(1, Number(size)),
        );
        return ApiResponse.success(result, HttpStatus.OK);
    }

    @Get('/streak')
    @UseGuards(OptionalJwtAuthGuard)
    async getStreakLeaderboard(
        @CurrentUser() user: JwtUser | null,
        @Query('page') page = '1',
        @Query('size') size = '50',
    ): Promise<ApiResponse<StreakLeaderboardResponseDto>> {
        const result = await this.leaderboardService.getStreakLeaderboard(
            user?.userId ?? null,
            Math.max(1, Number(page)),
            Math.max(1, Number(size)),
        );
        return ApiResponse.success(result, HttpStatus.OK);
    }
}
