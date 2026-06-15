import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { DailyChallengeRepository } from './daily-challenge.repository';
import { SnippetRepository } from '../snippet/snippet.repository';
import { SnippetResultRepository } from '../snippet-result/snippet-result.repository';
import { DailyChallengeResponseDto } from './dto/daily-challenge-response.dto';
import { SubmitDailyChallengeDto } from './dto/submit-daily-challenge.dto';
import { ChallengeLeaderboardResponseDto, LeaderboardItem, MyRankStatus } from './dto/challenge-leaderboard-response.dto';
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

@Injectable()
export class DailyChallengeService {
    constructor(
        private readonly dailyChallengeRepository: DailyChallengeRepository,
        private readonly snippetRepository: SnippetRepository,
        private readonly snippetResultRepository: SnippetResultRepository,
    ) {}

    async getDailyChallenge(): Promise<DailyChallengeResponseDto> {
        const challenge = await this.getSnippet();
        return DailyChallengeResponseDto.from(challenge);
    }

    @Transactional()
    async submit(dto: SubmitDailyChallengeDto, userId: number): Promise<SubmitDailyChallengeResponseDto> {
        const challenge = await this.getSnippet();
        const { start, end } = this.getTodayUtcRange(challenge.date);

        const beforeLeaderboard = await this.snippetResultRepository.findLeaderboard(
            challenge.snippetId, start, end,
        );

        const nWpm = dto.wpm * (dto.accuracy / 100);
        const savedResult = await this.snippetResultRepository.save({
            userId,
            snippetId: challenge.snippetId,
            wpm: dto.wpm,
            rawWpm: dto.rawWpm,
            accuracy: dto.accuracy,
            durationSec: dto.durationSec,
            nWpm,
            typos: dto.typos ?? [],
            replayData: dto.replayData ?? [],
            isDaily: true,
        });
        await this.snippetRepository.incrementStats(challenge.snippetId, dto.wpm);

        const afterLeaderboard = await this.snippetResultRepository.findLeaderboard(
            challenge.snippetId, start, end,
        );
        
        // 기존 데이터
        const beforeEntry = beforeLeaderboard.find(row => row.userId === userId);
        const afterEntry = afterLeaderboard.find(row => row.userId === userId);
        if (!afterEntry) throw new BusinessException(DailyError.NOT_FOUND);

        // 이후 데이터가 몇번째 row인지 (0-based index) → 랭킹은 1부터 시작하므로 +1
        const afterRank  = afterLeaderboard.indexOf(afterEntry) + 1;

        // 기존 데이터가 없으면 첫 제출이므로 beforeRank, rankDelta는 undefined
        const beforeRank = beforeEntry ? beforeLeaderboard.indexOf(beforeEntry) + 1 : undefined;

        // 기존 데이터가 있으면 isFirst = false → rankDelta 계산 가능, 없으면 isFirst = true → rankDelta는 undefined
        const isFirst    = !beforeEntry;

        // rankDelta는 기존 데이터가 있을 때만 계산 — 첫 제출은 순위 변동 수치 없음
        const rankDelta  = isFirst ? undefined : beforeRank! - afterRank;

        // rankChange는 첫 제출 여부와 rankDelta에 따라 결정
        const rankChange = isFirst        ? RankChangeStatus.FIRST_ATTEMPT
                         : rankDelta! > 0 ? RankChangeStatus.UP
                         : rankDelta! < 0 ? RankChangeStatus.DOWN
                         :                  RankChangeStatus.SAME;

        // 오늘 개인 최고 기록 갱신 여부 — 기존 데이터가 없으면 무조건 NEW_BEST, 기존 데이터가 있으면 nWpm 비교
        const bestStatus = !beforeEntry || Number(afterEntry.nWpm) > Number(beforeEntry.nWpm)
            ? BestStatus.NEW_BEST
            : BestStatus.NOT_BEST;

        // 랭킹 기준으로 위 2명·본인·아래 2명 추출 — afterRank 기준으로 상하 2명씩, 최대 5명
        const nearbyStart  = Math.max(0, afterRank - 3);

        // afterRank는 1-based이므로 nearbyStart도 1-based로 맞춰주기 위해 -1 → slice는 0-based이므로 결과적으로는 afterRank 기준으로 위 2명·본인·아래 2명 추출
        const nearbyUsers: NearbyUserItem[] = afterLeaderboard
            .slice(nearbyStart, afterRank + 2)
            .map((row, i) => {
                const item    = new NearbyUserItem();
                item.rank     = nearbyStart + i + 1;
                item.userId   = row.userId;
                item.username = row.username;
                item.nWpm     = Number(row.nWpm);
                item.relation = row.userId === userId ? NearbyUserRelation.ME : NearbyUserRelation.OTHER;
                return item;
            });

        return new SubmitDailyChallengeResponseDto({
            resultId: savedResult.id,
            nWpm: Number(afterEntry.nWpm), // DB decimal 저장값 기준으로 통일
            afterRank,
            beforeRank,
            rankDelta,
            rankChange,
            bestStatus,
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
