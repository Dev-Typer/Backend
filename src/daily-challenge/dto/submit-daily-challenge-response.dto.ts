export enum BestStatus {
  NEW_BEST = 'NEW_BEST', // 오늘 최고 기록 갱신 (첫 제출도 자동으로 NEW_BEST)
  NOT_BEST = 'NOT_BEST', // 갱신 실패 — 오늘 이미 더 높은 기록이 존재
}

export enum RankChangeStatus {
  FIRST_ATTEMPT = 'FIRST_ATTEMPT', // 오늘 첫 제출 — beforeRank / rankDelta 없음
  UP            = 'UP',            // 순위 상승
  DOWN          = 'DOWN',          // 순위 하락
  SAME          = 'SAME',          // 순위 유지
}

export enum NearbyUserRelation {
  ME    = 'ME',    // 현재 요청한 유저 본인
  OTHER = 'OTHER', // 다른 유저
}

export class NearbyUserItem {
  /** 오늘 리더보드 순위 */
  rank!: number;
  /** 유저 ID */
  userId!: number;
  /** 유저명 */
  username!: string;
  /** 오늘 최고 nWpm (wpm * accuracy / 100) */
  nWpm!: number;
  /** 요청 유저와의 관계 */
  relation!: NearbyUserRelation;
}

export class SubmitDailyChallengeResponseDto {
  /** 저장된 SnippetResult ID */
  resultId!: number;
  /** 이번 제출의 nWpm — 리더보드에 반영되는 값 */
  nWpm!: number;
  /** 제출 후 순위 */
  afterRank!: number;
  /** 제출 전 순위 — FIRST_ATTEMPT이면 없음 */
  beforeRank?: number;
  /** 순위 변동 수치 (양수 = 상승, 음수 = 하락) — FIRST_ATTEMPT이면 없음 */
  rankDelta?: number;
  /** 순위 변동 방향 */
  rankChange!: RankChangeStatus;
  /** 오늘 개인 최고 기록 갱신 여부 */
  bestStatus!: BestStatus;
  /** 이번 제출의 CORE 점수 */
  core!: number;
  /** 현재 순위 기준 위 2명·본인·아래 2명 (최대 5명) */
  nearbyUsers!: NearbyUserItem[];

  constructor(partial: Required<Pick<SubmitDailyChallengeResponseDto, 'resultId' | 'nWpm' | 'afterRank' | 'rankChange' | 'bestStatus' | 'core' | 'nearbyUsers'>> & Pick<SubmitDailyChallengeResponseDto, 'beforeRank' | 'rankDelta'>) {
    Object.assign(this, partial);
  }
}

