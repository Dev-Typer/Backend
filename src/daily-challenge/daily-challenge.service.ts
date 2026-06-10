import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyChallenge } from './entities/daily-challenge.entity';
import { DailyChallengeResponseDto } from './dto/daily-challenge-response.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { DailyError } from '../common/exceptions/error-code';

@Injectable()
export class DailyChallengeService {
    constructor(
        @InjectRepository(DailyChallenge)
        private dailyChallengeRepository: Repository<DailyChallenge>,
    ) {}

    async getDailyChallenge(): Promise<DailyChallengeResponseDto> {
        const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

        const challenge = await this.dailyChallengeRepository.findOne({
            where: { date: today },
            relations: { snippet: true },
        });

        if (!challenge) throw new BusinessException(DailyError.NOT_FOUND);

        return DailyChallengeResponseDto.from(challenge);
    }
}
