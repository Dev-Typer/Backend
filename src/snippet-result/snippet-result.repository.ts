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
    profileUrl: string | null;
    wpm: string;
    nWpm: string;
    core: string;
    accuracy: string;
    durationSec: number;
}

export interface RankingRow {
    userId: number;
    username: string;
    profileUrl: string | null;
    core: string;
    wpm: string;
    rawWpm: string;
    accuracy: string;
    durationSec: string;
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
            SELECT sub."userId", u.username, u."profileUrl", sub.wpm, sub."nWpm", sub.core, sub.accuracy, sub."durationSec"
            FROM (
                SELECT DISTINCT ON (r."userId")
                    r."userId", r.wpm, r."nWpm", r.core, r.accuracy, r."durationSec"
                FROM snippet_result r
                WHERE r."snippetId" = $1
                  AND r."isDaily" = true
                  AND r."createdAt" >= $2
                  AND r."createdAt" < $3
                ORDER BY r."userId", r.core DESC, r."nWpm" DESC, r.accuracy DESC, r."durationSec" ASC
            ) sub
            JOIN "user" u ON u.id = sub."userId"
            ORDER BY sub.core DESC, sub."nWpm" DESC, sub.accuracy DESC, sub."durationSec" ASC
            LIMIT 100
        `, [snippetId, start, end]);
    }

    // 스니펫별 랭킹 — 유저별 최고 core 플레이 한 행씩 추출, core DESC 페이지네이션
    async findRankingBySnippet(
        snippetId: number,
        page: number,
        size: number,
    ): Promise<{ rows: RankingRow[]; total: number }> {
        const offset = (page - 1) * size;
        const rows: RankingRow[] = await this.repo.query(`
            SELECT
                best."userId",
                u.username,
                u."profileUrl",
                best.core,
                best.wpm,
                best."rawWpm",
                best.accuracy,
                best."durationSec",
                best."createdAt"
            FROM (
                SELECT DISTINCT ON (r."userId")
                    r."userId", r.core, r.wpm, r."rawWpm", r.accuracy, r."durationSec", r."createdAt"
                FROM snippet_result r
                WHERE r."snippetId" = $1
                ORDER BY r."userId", r.core DESC
            ) best
            JOIN "user" u ON u.id = best."userId"
            ORDER BY best.core DESC
            LIMIT $2 OFFSET $3
        `, [snippetId, size, offset]);

        const countRows: { total: string }[] = await this.repo.query(`
            SELECT COUNT(DISTINCT "userId")::int AS total
            FROM snippet_result
            WHERE "snippetId" = $1
        `, [snippetId]);

        return { rows, total: Number(countRows[0]?.total ?? 0) };
    }

    // 유저의 특정 스니펫 기존 최고 core
    async findBestCoreByUserAndSnippet(userId: number, snippetId: number): Promise<number> {
        const rows: { core: string }[] = await this.repo.query(`
            SELECT COALESCE(MAX(core), 0) AS core
            FROM snippet_result
            WHERE "userId" = $1 AND "snippetId" = $2
        `, [userId, snippetId]);
        return Number(rows[0]?.core ?? 0);
    }

    // 유저별 최고 core 기준 순위 계산
    async calcRank(snippetId: number, myCore: number): Promise<number> {
        const raw: { count: string }[] = await this.repo.query(`
            SELECT COUNT(DISTINCT best."userId") AS count
            FROM (
                SELECT DISTINCT ON ("userId") "userId", core
                FROM snippet_result
                WHERE "snippetId" = $1
                ORDER BY "userId", core DESC
            ) best
            WHERE best.core > $2
        `, [snippetId, myCore]);

        return Number(raw[0]?.count ?? 0) + 1;
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

    // 월별 누적 Total CORE 이력 — LATERAL JOIN으로 6개월 단일 쿼리 처리
    async getCoreHistoryByMonth(
        userId: number,
        months: number,
    ): Promise<{ month_start: string; total_core: string }[]> {
        return this.repo.query(`
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', NOW()) - ($2::int - 1) * INTERVAL '1 month',
                    date_trunc('month', NOW()),
                    INTERVAL '1 month'
                )::date AS month_start
            )
            SELECT
                m.month_start,
                COALESCE(SUM(best.core::numeric), 0) AS total_core
            FROM months m
            LEFT JOIN LATERAL (
                SELECT DISTINCT ON (sr."snippetId") sr.core
                FROM snippet_result sr
                WHERE sr."userId" = $1
                  AND sr."createdAt" < (m.month_start + INTERVAL '1 month')::timestamptz
                ORDER BY sr."snippetId", sr.core DESC
            ) best ON TRUE
            GROUP BY m.month_start
            ORDER BY m.month_start
        `, [userId, months]);
    }

    // 날짜별 제출 여부 + 최고 WPM — streak 그리드용
    // start/end: 'YYYY-MM-DD' (inclusive)
    async getStreakDayData(
        userId: number,
        start: string,
        end: string,
    ): Promise<{ day: string; wpm: number }[]> {
        return this.repo.query(`
            SELECT
                "createdAt"::date::text AS day,
                MAX(wpm)::float         AS wpm
            FROM snippet_result
            WHERE "userId" = $1
              AND "createdAt"::date BETWEEN $2::date AND $3::date
            GROUP BY day
            ORDER BY day
        `, [userId, start, end]);
    }

    // 역대 최장 연속 제출 일수 — 전체 기간 기준
    async getLongestStreak(userId: number): Promise<number> {
        const rows: { longest: string }[] = await this.repo.query(`
            WITH daily AS (
                SELECT DISTINCT "createdAt"::date AS day
                FROM snippet_result
                WHERE "userId" = $1
            ),
            grouped AS (
                SELECT day, day - (ROW_NUMBER() OVER (ORDER BY day))::int AS grp
                FROM daily
            ),
            counts AS (
                SELECT COUNT(*) AS cnt
                FROM grouped
                GROUP BY grp
            )
            SELECT COALESCE(MAX(cnt), 0) AS longest
            FROM counts
        `, [userId]);

        return rows.length ? Number(rows[0].longest) : 0;
    }

    // 유저의 스니펫별 최고 core 합산 — 홈 summary용
    async getTotalCore(userId: number): Promise<number> {
        const rows: { total_core: string }[] = await this.repo.query(`
            SELECT COALESCE(SUM(best_core), 0) AS total_core
            FROM (
                SELECT "snippetId", MAX(core) AS best_core
                FROM snippet_result
                WHERE "userId" = $1
                GROUP BY "snippetId"
            ) sub
        `, [userId]);
        return Number(rows[0]?.total_core ?? 0);
    }

    // 현재 연속 제출 일수 — 오늘 제출 시 오늘 기준, 아니면 어제 기준
    async getCurrentStreak(userId: number): Promise<number> {
        const rows: { current_streak: string }[] = await this.repo.query(`
            WITH daily AS (
                SELECT DISTINCT ("createdAt" AT TIME ZONE 'UTC')::date AS day
                FROM snippet_result
                WHERE "userId" = $1
            ),
            base AS (
                SELECT CASE
                    WHEN EXISTS (SELECT 1 FROM daily WHERE day = (NOW() AT TIME ZONE 'UTC')::date)
                    THEN (NOW() AT TIME ZONE 'UTC')::date
                    ELSE (NOW() AT TIME ZONE 'UTC')::date - 1
                END AS base_day
            ),
            numbered AS (
                SELECT day,
                       ROW_NUMBER() OVER (ORDER BY day DESC) - 1 AS rn
                FROM daily
                WHERE day <= (SELECT base_day FROM base)
            ),
            streak AS (
                SELECT COUNT(*) AS current_streak
                FROM numbered
                WHERE day = (SELECT base_day FROM base) - rn
            )
            SELECT current_streak FROM streak
        `, [userId]);
        return rows.length ? Number(rows[0].current_streak) : 0;
    }

    // 월별 평균 WPM — 최근 N개월
    async getWpmMonthlyHistory(
        userId: number,
        months: number,
    ): Promise<{ month: string; avg_wpm: string }[]> {
        return this.repo.query(`
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', NOW()) - ($2::int - 1) * INTERVAL '1 month',
                    date_trunc('month', NOW()),
                    INTERVAL '1 month'
                )::date AS month_start
            )
            SELECT
                TO_CHAR(m.month_start, 'YYYY-MM') AS month,
                COALESCE(ROUND(AVG(sr.wpm)::numeric, 1), 0)::text AS avg_wpm
            FROM months m
            LEFT JOIN snippet_result sr
                   ON sr."userId" = $1
                  AND date_trunc('month', sr."createdAt") = m.month_start
            GROUP BY m.month_start
            ORDER BY m.month_start
        `, [userId, months]);
    }
}
