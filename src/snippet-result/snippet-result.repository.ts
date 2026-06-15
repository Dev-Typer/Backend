import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SnippetResult } from './entities/snippet-result.entity';

export interface LeaderboardRow {
    userId: number;
    username: string;
    nWpm: string; // TypeORM decimal → string으로 반환됨
}

export interface FullLeaderboardRow {
    userId: number;
    username: string;
    wpm: string;
    nWpm: string;
    accuracy: string;
    durationSec: number;
}

export interface RankingRow {
    userId: number;
    username: string;
    wpm: string;
    accuracy: string;
    createdAt: Date;
}

@Injectable()
export class SnippetResultRepository {
    constructor(
        @InjectRepository(SnippetResult)
        private readonly repo: Repository<SnippetResult>,
    ) {}

    async findById(id: number): Promise<SnippetResult | null> {
        return this.repo.findOne({ where: { id } });
    }

    async save(data: Partial<SnippetResult>): Promise<SnippetResult> {
        return this.repo.save(this.repo.create(data));
    }

    // 오늘 daily 리더보드 — 유저별 최고 nWpm 기준 정렬
    async findLeaderboard(
        snippetId: number,
        start: Date,
        end: Date,
    ): Promise<LeaderboardRow[]> {
        return this.repo
            .createQueryBuilder('r')
            .select('r.userId', 'userId')
            .addSelect('u.username', 'username')
            .addSelect('MAX(r.nWpm)', 'nWpm')
            .innerJoin('r.user', 'u')
            .where('r.snippetId = :snippetId', { snippetId })
            .andWhere('r.isDaily = true')
            .andWhere('r.createdAt >= :start', { start })
            .andWhere('r.createdAt < :end', { end })
            .groupBy('r.userId')
            .addGroupBy('u.username')
            .orderBy('MAX(r.nWpm)', 'DESC')
            .getRawMany<LeaderboardRow>();
    }

    // 오늘 daily 전체 리더보드 — DISTINCT ON으로 유저별 최고 nWpm 행만 추출, 상위 100위
    async findFullLeaderboard(
        snippetId: number,
        start: Date,
        end: Date,
    ): Promise<FullLeaderboardRow[]> {
        return this.repo.query(`
            SELECT sub."userId", u.username, sub.wpm, sub."nWpm", sub.accuracy, sub."durationSec"
            FROM (
                SELECT DISTINCT ON (r."userId")
                    r."userId", r.wpm, r."nWpm", r.accuracy, r."durationSec"
                FROM snippet_result r
                WHERE r."snippetId" = $1
                  AND r."isDaily" = true
                  AND r."createdAt" >= $2
                  AND r."createdAt" < $3
                ORDER BY r."userId", r."nWpm" DESC, r.accuracy DESC, r."durationSec" ASC
            ) sub
            JOIN "user" u ON u.id = sub."userId"
            ORDER BY sub."nWpm" DESC, sub.accuracy DESC, sub."durationSec" ASC
            LIMIT 100
        `, [snippetId, start, end]);
    }

    // 스니펫별 랭킹 — 유저별 최고 기록 기준 상위 50위
    async findRankingBySnippet(snippetId: number): Promise<RankingRow[]> {
        return this.repo
            .createQueryBuilder('r')
            .select('r.userId', 'userId')
            .addSelect('u.username', 'username')
            .addSelect('MAX(r.wpm)', 'wpm')
            .addSelect('MAX(r.accuracy)', 'accuracy')
            .addSelect('MAX(r.createdAt)', 'createdAt')
            .innerJoin('r.user', 'u')
            .where('r.snippetId = :snippetId', { snippetId })
            .groupBy('r.userId')
            .addGroupBy('u.username')
            .orderBy('MAX(r.wpm)', 'DESC')
            .addOrderBy('MAX(r.accuracy)', 'DESC')
            .limit(50)
            .getRawMany<RankingRow>();
    }

    // 유저별 최고 기록 기준 순위 계산
    async calcRank(snippetId: number, myWpm: number): Promise<number> {
        const raw = await this.repo
            .createQueryBuilder('r')
            .select('COUNT(DISTINCT r.userId)', 'count')
            .where('r.snippetId = :snippetId')
            .andWhere((qb) => {
                const sub = qb
                    .subQuery()
                    .select('MAX(s.wpm)')
                    .from(SnippetResult, 's')
                    .where('s.snippetId = :snippetId')
                    .andWhere('s.userId = r.userId')
                    .getQuery();
                return `(${sub}) > :myWpm`;
            })
            .setParameters({ snippetId, myWpm })
            .getRawOne<{ count: string }>();

        return Number(raw?.count ?? 0) + 1;
    }
}
