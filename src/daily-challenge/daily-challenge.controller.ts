import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../common/dto/api-response';
import { DailyChallengeResponseDto } from './dto/daily-challenge-response.dto';
import { DailyChallengeService } from './daily-challenge.service';

@Controller('/api/daily-challenge')
export class DailyChallengeController {
    constructor(private readonly dailyChallengeService: DailyChallengeService) {}

    @Get()
    async getDailyChallenge(): Promise<ApiResponse<DailyChallengeResponseDto>> {
        const result = await this.dailyChallengeService.getDailyChallenge();
        return ApiResponse.success(result, HttpStatus.OK);
    }
}