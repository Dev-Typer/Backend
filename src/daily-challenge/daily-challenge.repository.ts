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

    // 스니펫별 daily 노출 횟수 — daily_challenge 테이블만 조회 (cross-domain JOIN 없음)
    async findUsageCounts(): Promise<{ snippetId: number; count: number }[]> {
        const rows: { snippetId: number; count: string }[] = await this.repo.query(
            `SELECT "snippetId", COUNT(*) as count FROM daily_challenge GROUP BY "snippetId"`,
        );
        return rows.map(r => ({ snippetId: r.snippetId, count: Number(r.count) }));
    }
}
