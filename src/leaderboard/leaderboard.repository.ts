import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { SoloRankRow } from './dto/solo-leaderboard-response.dto';
import type { StreakRankRow } from './dto/streak-leaderboard-response.dto';

@Injectable()
export class LeaderboardRepository {
    constructor(private readonly dataSource: DataSource) {}

    async getSoloLeaderboard(
        language: string | undefined,
        page: number,
        size: number,
    ): Promise<SoloRankRow[]> {
        const offset = (page - 1) * size;

        if (language) {
            return this.dataSource.query(`
                WITH best AS (
                    SELECT sr."userId", sr."snippetId", MAX(sr.core) AS best_core
                    FROM snippet_result sr
                    JOIN snippet s ON s.id = sr."snippetId"
                        AND LOWER(s.language::text) = LOWER($1)
                    GROUP BY sr."userId", sr."snippetId"
                ),
                totals AS (
                    SELECT "userId", COALESCE(SUM(best_core), 0) AS "totalCore"
                    FROM best GROUP BY "userId"
                ),
                play_stats AS (
                    SELECT sr2."userId",
                           COUNT(*) AS play_count,
                           ROUND(AVG(sr2.wpm)::numeric, 1) AS avg_wpm,
                           COUNT(DISTINCT sr2."snippetId") AS snippet_count,
                           ROUND(AVG(sr2.accuracy)::numeric, 1) AS avg_accuracy
                    FROM snippet_result sr2
                    JOIN snippet s2 ON s2.id = sr2."snippetId"
                        AND LOWER(s2.language::text) = LOWER($1)
                    GROUP BY sr2."userId"
                ),
                agg AS (
                    SELECT
                        u.id                                  AS "userId",
                        u.username,
                        u."profileUrl",
                        COALESCE(t."totalCore", 0)            AS "totalCore",
                        COALESCE(ps.avg_wpm, 0)               AS "avgWpm",
                        COALESCE(ps.play_count, 0)            AS "playCount",
                        COALESCE(ps.snippet_count, 0)         AS "snippetCount",
                        COALESCE(ps.avg_accuracy, 0)          AS "avgAccuracy"
                    FROM "user" u
                    LEFT JOIN totals t     ON t."userId" = u.id
                    LEFT JOIN play_stats ps ON ps."userId" = u.id
                    ),
                ranked AS (
                    SELECT *, RANK() OVER (ORDER BY "totalCore" DESC)::int AS rank
                    FROM agg
                    WHERE "totalCore" > 0
                )
                SELECT *, COUNT(*) OVER()::int AS total_count
                FROM ranked
                ORDER BY rank
                LIMIT $2 OFFSET $3
            `, [language, size, offset]);
        }

        return this.dataSource.query(`
            WITH best AS (
                SELECT "userId", "snippetId", MAX(core) AS best_core
                FROM snippet_result
                GROUP BY "userId", "snippetId"
            ),
            totals AS (
                SELECT "userId", COALESCE(SUM(best_core), 0) AS "totalCore"
                FROM best GROUP BY "userId"
            ),
            play_stats AS (
                SELECT "userId",
                       COUNT(*) AS play_count,
                       ROUND(AVG(wpm)::numeric, 1) AS avg_wpm,
                       COUNT(DISTINCT "snippetId") AS snippet_count,
                       ROUND(AVG(accuracy)::numeric, 1) AS avg_accuracy
                FROM snippet_result
                GROUP BY "userId"
            ),
            agg AS (
                SELECT
                    u.id                                  AS "userId",
                    u.username,
                    u."profileUrl",
                    COALESCE(t."totalCore", 0)            AS "totalCore",
                    COALESCE(ps.avg_wpm, 0)               AS "avgWpm",
                    COALESCE(ps.play_count, 0)            AS "playCount",
                    COALESCE(ps.snippet_count, 0)         AS "snippetCount",
                    COALESCE(ps.avg_accuracy, 0)          AS "avgAccuracy"
                FROM "user" u
                LEFT JOIN totals t     ON t."userId" = u.id
                LEFT JOIN play_stats ps ON ps."userId" = u.id
            ),
            ranked AS (
                SELECT *, RANK() OVER (ORDER BY "totalCore" DESC)::int AS rank
                FROM agg
                WHERE "totalCore" > 0
            )
            SELECT *, COUNT(*) OVER()::int AS total_count
            FROM ranked
            ORDER BY rank
            LIMIT $1 OFFSET $2
        `, [size, offset]);
    }

    async getMySoloRank(userId: number, language?: string): Promise<number | null> {
        let rows: { rank: string }[];

        if (language) {
            rows = await this.dataSource.query(`
                WITH best AS (
                    SELECT sr."userId", sr."snippetId", MAX(sr.core) AS best_core
                    FROM snippet_result sr
                    JOIN snippet s ON s.id = sr."snippetId"
                        AND LOWER(s.language::text) = LOWER($2)
                    GROUP BY sr."userId", sr."snippetId"
                ),
                totals AS (
                    SELECT "userId", COALESCE(SUM(best_core), 0) AS "totalCore"
                    FROM best GROUP BY "userId"
                ),
                ranked AS (
                    SELECT t."userId", RANK() OVER (ORDER BY t."totalCore" DESC)::int AS rank
                    FROM totals t
                    JOIN "user" u ON u.id = t."userId"
                    WHERE t."totalCore" > 0
                )
                SELECT rank FROM ranked WHERE "userId" = $1
            `, [userId, language]);
        } else {
            rows = await this.dataSource.query(`
                WITH best AS (
                    SELECT sr."userId", sr."snippetId", MAX(sr.core) AS best_core
                    FROM snippet_result sr
                    GROUP BY sr."userId", sr."snippetId"
                ),
                totals AS (
                    SELECT "userId", COALESCE(SUM(best_core), 0) AS "totalCore"
                    FROM best GROUP BY "userId"
                ),
                ranked AS (
                    SELECT t."userId", RANK() OVER (ORDER BY t."totalCore" DESC)::int AS rank
                    FROM totals t
                    JOIN "user" u ON u.id = t."userId"
                    WHERE t."totalCore" > 0
                )
                SELECT rank FROM ranked WHERE "userId" = $1
            `, [userId]);
        }

        return rows.length ? Number(rows[0].rank) : null;
    }

    async getStreakLeaderboard(page: number, size: number): Promise<StreakRankRow[]> {
        const offset = (page - 1) * size;
        return this.dataSource.query(`
            WITH all_daily AS (
                SELECT "userId", ("createdAt" AT TIME ZONE 'UTC')::date AS day
                FROM snippet_result
                GROUP BY "userId", ("createdAt" AT TIME ZONE 'UTC')::date
            ),
            today_submitters AS (
                SELECT DISTINCT "userId"
                FROM all_daily
                WHERE day = (NOW() AT TIME ZONE 'UTC')::date
            ),
            base_days AS (
                SELECT
                    u.id AS "userId",
                    CASE
                        WHEN ts."userId" IS NOT NULL
                        THEN (NOW() AT TIME ZONE 'UTC')::date
                        ELSE (NOW() AT TIME ZONE 'UTC')::date - 1
                    END AS base_day
                FROM "user" u
                LEFT JOIN today_submitters ts ON ts."userId" = u.id
            ),
            numbered AS (
                SELECT
                    d."userId",
                    d.day,
                    (ROW_NUMBER() OVER (PARTITION BY d."userId" ORDER BY d.day DESC) - 1)::int AS rn,
                    b.base_day
                FROM all_daily d
                JOIN base_days b ON b."userId" = d."userId"
                WHERE d.day <= b.base_day
            ),
            streak_calc AS (
                SELECT "userId", COUNT(*)::int AS current_streak
                FROM numbered
                WHERE day = base_day - rn
                GROUP BY "userId"
            ),
            ranked AS (
                SELECT
                    u.id               AS "userId",
                    u.username,
                    u."profileUrl",
                    s.current_streak,
                    RANK() OVER (ORDER BY s.current_streak DESC)::int AS rank
                FROM "user" u
                JOIN streak_calc s ON s."userId" = u.id
                WHERE s.current_streak > 0
            )
            SELECT *, COUNT(*) OVER()::int AS total_count
            FROM ranked
            ORDER BY rank
            LIMIT $1 OFFSET $2
        `, [size, offset]);
    }

    async getMyStreakRank(userId: number): Promise<number | null> {
        const rows: { rank: string }[] = await this.dataSource.query(`
            WITH all_daily AS (
                SELECT "userId", ("createdAt" AT TIME ZONE 'UTC')::date AS day
                FROM snippet_result
                GROUP BY "userId", ("createdAt" AT TIME ZONE 'UTC')::date
            ),
            today_submitters AS (
                SELECT DISTINCT "userId"
                FROM all_daily
                WHERE day = (NOW() AT TIME ZONE 'UTC')::date
            ),
            base_days AS (
                SELECT
                    u.id AS "userId",
                    CASE
                        WHEN ts."userId" IS NOT NULL
                        THEN (NOW() AT TIME ZONE 'UTC')::date
                        ELSE (NOW() AT TIME ZONE 'UTC')::date - 1
                    END AS base_day
                FROM "user" u
                LEFT JOIN today_submitters ts ON ts."userId" = u.id
            ),
            numbered AS (
                SELECT
                    d."userId",
                    d.day,
                    (ROW_NUMBER() OVER (PARTITION BY d."userId" ORDER BY d.day DESC) - 1)::int AS rn,
                    b.base_day
                FROM all_daily d
                JOIN base_days b ON b."userId" = d."userId"
                WHERE d.day <= b.base_day
            ),
            streak_calc AS (
                SELECT "userId", COUNT(*)::int AS current_streak
                FROM numbered
                WHERE day = base_day - rn
                GROUP BY "userId"
            ),
            ranked AS (
                SELECT
                    s."userId",
                    RANK() OVER (ORDER BY s.current_streak DESC)::int AS rank
                FROM streak_calc s
                JOIN "user" u ON u.id = s."userId"
                WHERE s.current_streak > 0
            )
            SELECT rank FROM ranked WHERE "userId" = $1
        `, [userId]);

        return rows.length ? Number(rows[0].rank) : null;
    }
}
