import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SnippetResult } from './entities/snippet-result.entity';

export interface UserRankInfo {
    rank: number;
    userId: number;
    nWpm: string; // TypeORM decimal → string
}

export interface NearbyRow {
    rank: number;
    userId: number;
    username: string;
    nWpm: string;
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

    // 특정 유저의 순위 + 최고 nWpm — SQL RANK() 윈도우 함수로 단일 행 반환
    async findUserRankInfo(
        snippetId: number,
        userId: number,
        start: Date,
        end: Date,
    ): Promise<UserRankInfo | null> {
        const rows: (UserRankInfo & { rank: string })[] = await this.repo.query(`
            SELECT rank, "userId", "nWpm"
            FROM (
                SELECT
                    RANK() OVER (ORDER BY "nWpm" DESC, accuracy DESC, "durationSec" ASC) AS rank,
                    "userId",
                    "nWpm"
                FROM (
                    SELECT DISTINCT ON (r."userId")
                        r."userId", r."nWpm", r.accuracy, r."durationSec"
                    FROM snippet_result r
                    WHERE r."snippetId" = $1
                      AND r."isDaily" = true
                      AND r."createdAt" >= $2
                      AND r."createdAt" < $3
                    ORDER BY r."userId", r."nWpm" DESC, r.accuracy DESC, r."durationSec" ASC
                ) best
            ) ranked
            WHERE "userId" = $4
        `, [snippetId, start, end, userId]);

        if (!rows.length) return null;
        return { rank: Number(rows[0].rank), userId: rows[0].userId, nWpm: rows[0].nWpm };
    }

    // 제출자 순위 기준 위 2명·본인·아래 2명 — SQL RANK()로 최대 5행만 반환
    async findNearbyUsers(
        snippetId: number,
        start: Date,
        end: Date,
        userRank: number,
    ): Promise<NearbyRow[]> {
        const rows: (NearbyRow & { rank: string })[] = await this.repo.query(`
            SELECT rank, "userId", username, "nWpm"
            FROM (
                SELECT
                    RANK() OVER (ORDER BY best."nWpm" DESC, best.accuracy DESC, best."durationSec" ASC) AS rank,
                    best."userId",
                    u.username,
                    best."nWpm"
                FROM (
                    SELECT DISTINCT ON (r."userId")
                        r."userId", r."nWpm", r.accuracy, r."durationSec"
                    FROM snippet_result r
                    WHERE r."snippetId" = $1
                      AND r."isDaily" = true
                      AND r."createdAt" >= $2
                      AND r."createdAt" < $3
                    ORDER BY r."userId", r."nWpm" DESC, r.accuracy DESC, r."durationSec" ASC
                ) best
                JOIN "user" u ON u.id = best."userId"
            ) ranked
            WHERE rank BETWEEN GREATEST(1, $4 - 2) AND $4 + 2
            ORDER BY rank
        `, [snippetId, start, end, userRank]);

        return rows.map(r => ({ ...r, rank: Number(r.rank) }));
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

    // 유저의 스니펫별 최고 core — 언어 정보 포함, by-language 집계용
    async getBestCoresByUserWithLanguage(
        userId: number,
    ): Promise<{ snippetId: number; core: string; language: string }[]> {
        return this.repo.query(`
            SELECT DISTINCT ON (sr."snippetId")
                sr."snippetId",
                sr.core,
                s.language
            FROM snippet_result sr
            JOIN snippet s ON s.id = sr."snippetId"
            WHERE sr."userId" = $1
            ORDER BY sr."snippetId", sr.core DESC
        `, [userId]);
    }

    // 유저의 스니펫별 최고 core 중 상위 100개 — Total CORE 계산용
    async getTop100BestCoresByUser(userId: number): Promise<SnippetResult[]> {
    
        const rows: { id: number }[] = await this.repo.query(`
            SELECT id FROM (
                SELECT DISTINCT ON ("snippetId") id, core
                FROM snippet_result
                WHERE "userId" = $1
                ORDER BY "snippetId", core DESC
            ) best
            ORDER BY core DESC
            LIMIT 100
        `, [userId]);

        if (!rows.length) return [];  // 빈 배열일 때 In([]) 쿼리 방지

        const ids = rows.map(r => r.id);

        const results = await this.repo.find({
            where: { id: In(ids) },
            relations: { snippet: true },
        });

        const resultMap = new Map(results.map(r => [r.id, r]));
        return ids.map(id => resultMap.get(id)!).filter(Boolean);
    }
}
