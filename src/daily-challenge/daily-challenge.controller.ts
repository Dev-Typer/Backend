import { Body, Controller, Get, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiResponse } from '../common/dto/api-response';
import { DailyChallengeResponseDto } from './dto/daily-challenge-response.dto';
import { SubmitDailyChallengeDto } from './dto/submit-daily-challenge.dto';
import { SubmitDailyChallengeResponseDto } from './dto/submit-daily-challenge-response.dto';
import { DailyChallengeService } from './daily-challenge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/types/jwt-user.type';

@Controller('/api/daily-challenge')
export class DailyChallengeController {
    constructor(private readonly dailyChallengeService: DailyChallengeService) {}

    // GET /api/daily-challenge
    // 인증 불필요 — 누구나 오늘 챌린지 조회 가능
    @Get()
    async getDailyChallenge(): Promise<ApiResponse<DailyChallengeResponseDto>> {
        const result = await this.dailyChallengeService.getDailyChallenge();
        return ApiResponse.success(result, HttpStatus.OK);
    }

    // POST /api/daily-challenge/submit
    // 인증 필수 — 비로그인은 제출 의미 없음 (리더보드, 칭호 모두 userId 필요)
    @Post('/submit')
    @UseGuards(JwtAuthGuard)
    async submit(
        @CurrentUser() user: JwtUser,
        @Body() dto: SubmitDailyChallengeDto,
    ): Promise<ApiResponse<SubmitDailyChallengeResponseDto>> {
        const result = await this.dailyChallengeService.submit(dto, user.userId);
        return ApiResponse.success(result, HttpStatus.CREATED);
    }
}
