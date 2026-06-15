import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyChallenge } from './entities/daily-challenge.entity';

@Injectable()
export class DailyChallengeRepository {
    constructor(
        @InjectRepository(DailyChallenge)
        private readonly repo: Repository<DailyChallenge>,
    ) {}

    async findByDate(date: string): Promise<DailyChallenge | null> {
        return this.repo.findOne({
            where: { date },
            relations: { snippet: true },
        });
    }
}
