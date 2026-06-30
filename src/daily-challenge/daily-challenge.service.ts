import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { DailyChallengeRepository } from './daily-challenge.repository';
import { SnippetRepository } from '../snippet/default/snippet.repository';
import { SnippetResultRepository } from '../snippet-result/snippet-result.repository';
import { DailyChallengeResponseDto } from './dto/daily-challenge-response.dto';
import { SubmitDailyChallengeDto } from './dto/submit-daily-challenge.dto';
import { ChallengeLeaderboardResponseDto, LeaderboardItem, MyRankStatus } from './dto/challenge-leaderboard-response.dto';
import { calculateCore, calculateRawCore, calculateNWpm } from '../common/utils/core-calculator.util';
import {
    BestStatus,
    NearbyUserItem,
    NearbyUserRelation,
    RankChangeStatus,
    SubmitDailyChallengeResponseDto,
} from './dto/submit-daily-challenge-response.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { DailyError } from '../common/exceptions/error-code';
import { DailyChallenge } from './entities/daily-challenge.entity';
import { BadgeService } from '../badge/badge.service';

@Injectable()
export class DailyChallengeService {
    constructor(
        private readonly dailyChallengeRepository: DailyChallengeRepository,
        private readonly snippetRepository: SnippetRepository,
        private readonly snippetResultRepository: SnippetResultRepository,
        private readonly badgeService: BadgeService,
    ) {}

    async getDailyChallenge(): Promise<DailyChallengeResponseDto> {
        const challenge = await this.getSnippet();
        return DailyChallengeResponseDto.from(challenge);
    }

    @Transactional()
    async submit(dto: SubmitDailyChallengeDto, userId: number): Promise<SubmitDailyChallengeResponseDto> {
        const challenge = await this.getSnippet();
        const { start, end } = this.getTodayUtcRange(challenge.date);

        const beforeRankInfo = await this.snippetResultRepository.findUserRankInfo(
            challenge.snippetId, userId, start, end,
        );

        const nWpm = calculateNWpm(dto.wpm, dto.accuracy);

        const core = calculateCore(
            dto.wpm,
            dto.accuracy,
            challenge.snippet.difficulty,
            challenge.snippet.content.length,
        );

        const rawCore = calculateRawCore(
            dto.rawWpm,
            challenge.snippet.difficulty,
            challenge.snippet.content.length,
        );

        const savedResult = await this.snippetResultRepository.save({
            userId,
            snippetId: challenge.snippetId,
            wpm: dto.wpm,
            rawWpm: dto.rawWpm,
            accuracy: dto.accuracy,
            durationSec: dto.durationSec,
            nWpm,
            core,
            rawCore,
            typos: dto.typos ?? [],
            replayData: dto.replayData ?? [],
            isDaily: true,
        });
        await this.snippetRepository.incrementStats(challenge.snippetId, dto.wpm);
        await this.badgeService.awardLanguageBadge(userId, challenge.snippet.language);

        const afterRankInfo = await this.snippetResultRepository.findUserRankInfo(
            challenge.snippetId, userId, start, end,
        );
        if (!afterRankInfo) throw new BusinessException(DailyError.NOT_FOUND);

        const afterRank  = afterRankInfo.rank;
        const beforeRank = beforeRankInfo?.rank;
        const isFirst    = !beforeRankInfo;
        const rankDelta  = isFirst ? undefined : beforeRank! - afterRank;
        const rankChange = isFirst        ? RankChangeStatus.FIRST_ATTEMPT
                         : rankDelta! > 0 ? RankChangeStatus.UP
                         : rankDelta! < 0 ? RankChangeStatus.DOWN
                         :                  RankChangeStatus.SAME;

        const bestStatus = !beforeRankInfo || Number(afterRankInfo.core) > Number(beforeRankInfo.core)
            ? BestStatus.NEW_BEST
            : BestStatus.NOT_BEST;

        const nearbyRows = await this.snippetResultRepository.findNearbyUsers(
            challenge.snippetId, start, end, afterRank,
        );
        const nearbyUsers: NearbyUserItem[] = nearbyRows.map(row => {
            const item    = new NearbyUserItem();
            item.rank     = row.rank;
            item.userId   = row.userId;
            item.username = row.username;
            item.nWpm     = Number(row.nWpm);
            item.relation = row.userId === userId ? NearbyUserRelation.ME : NearbyUserRelation.OTHER;
            return item;
        });

        return new SubmitDailyChallengeResponseDto({
            resultId: savedResult.id,
            nWpm: Number(afterRankInfo.nWpm),
            afterRank,
            beforeRank,
            rankDelta,
            rankChange,
            bestStatus,
            core,
            nearbyUsers,
        });
    }

    async getLeaderboard(userId?: number): Promise<ChallengeLeaderboardResponseDto> {
        const challenge = await this.getSnippet();
        const { start, end } = this.getTodayUtcRange(challenge.date);

        const rows = await this.snippetResultRepository.findFullLeaderboard(
            challenge.snippetId, start, end,
        );

        const items: LeaderboardItem[] = rows.map((row, i) => new LeaderboardItem({
            rank: i + 1,
            userId: row.userId,
            username: row.username,
            profileUrl: row.profileUrl,
            core: Number(row.core),
            wpm: Number(row.wpm),
            nWpm: Number(row.nWpm),
            accuracy: Number(row.accuracy),
            durationSec: row.durationSec,
        }));

        const myItem = userId !== undefined
            ? items.find(item => item.userId === userId)
            : undefined;

        const myRankStatus = userId === undefined  ? MyRankStatus.NOT_LOGGED_IN
                           : myItem === undefined   ? MyRankStatus.NOT_PARTICIPATED
                           :                         MyRankStatus.RANKED;

        return new ChallengeLeaderboardResponseDto({
            date: challenge.date,
            snippetId: challenge.snippetId,
            items,
            total: items.length,
            myRankStatus,
            myRank: myItem?.rank,
        });
    }

    async selectNextSnippet(): Promise<void> {
        const date = new Date().toISOString().slice(0, 10); // UTC 오늘 날짜

        // m-2: 이미 오늘 챌린지가 있으면 중복 생성 방지
        const existing = await this.dailyChallengeRepository.findByDate(date);
        if (existing) return;

        // daily_challenge 테이블에서 스니펫별 노출 횟수를 가져온 뒤
        // snippet 테이블에서 활성 스니펫 전체를 가져와 Service에서 조율
        const [usageCounts, activeSnippets] = await Promise.all([
            this.dailyChallengeRepository.findUsageCounts(),
            this.snippetRepository.findAllActive(),
        ]);

        if (!activeSnippets.length) return;

        const countMap = new Map(usageCounts.map(r => [r.snippetId, r.count]));

        // 노출 횟수 적은 것 → playCount 적은 것 순으로 후보 선정
        const sorted = activeSnippets
            .map(s => ({ id: s.id, score: (countMap.get(s.id) ?? 0) * 100_000 + s.playCount }))
            .sort((a, b) => a.score - b.score);

        const minScore = sorted[0].score;
        const candidates = sorted.filter(s => s.score === minScore);
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];

        await this.dailyChallengeRepository.save({ snippetId: chosen.id, date });
    }

    private getTodayUtcRange(today: string): { start: Date; end: Date } {
        const start = new Date(`${today}T00:00:00Z`);
        const end   = new Date(`${today}T00:00:00Z`);
        end.setUTCDate(end.getUTCDate() + 1);
        return { start, end };
    }

    private async getSnippet(): Promise<DailyChallenge> {
        const today = new Date().toISOString().slice(0, 10); // UTC 날짜
        const challenge = await this.dailyChallengeRepository.findByDate(today);
        if (!challenge) throw new BusinessException(DailyError.NOT_FOUND);
        return challenge;
    }
}
