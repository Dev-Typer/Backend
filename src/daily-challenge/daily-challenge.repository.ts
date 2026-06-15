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

    async save(data: Pick<DailyChallenge, 'snippetId' | 'date'>): Promise<DailyChallenge> {
        return this.repo.save(this.repo.create(data));
    }

    // 노출 횟수 적은 순 → 플레이 수 낮은 순 → 랜덤으로 다음 daily 스니펫 ID 선정
    async findNextSnippetId(): Promise<number | null> {
        const rows: { id: number }[] = await this.repo.query(`
            SELECT s.id
            FROM snippet s
            LEFT JOIN daily_challenge dc ON dc."snippetId" = s.id
            WHERE s."isActive" = true
            GROUP BY s.id, s."playCount"
            ORDER BY COUNT(dc.id) ASC, s."playCount" ASC, RANDOM()
            LIMIT 1
        `);
        return rows[0]?.id ?? null;
    }
}
