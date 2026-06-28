export enum MyRankStatus {
  NOT_LOGGED_IN    = 'NOT_LOGGED_IN',    // 비로그인
  NOT_PARTICIPATED = 'NOT_PARTICIPATED', // 로그인했지만 오늘 미참여
  RANKED           = 'RANKED',           // 참여 + 순위 있음
}

export class LeaderboardItem {
  /** 순위 */
  rank!: number;
  /** 유저 ID */
  userId!: number;
  /** 유저명 */
  username!: string;
  /** 프로필 이미지 URL */
  profileUrl!: string | null;
  /** CORE 점수 */
  core!: number;
  /** 정타 WPM */
  wpm!: number;
  /** 정규화 WPM (wpm * accuracy / 100) */
  nWpm!: number;
  /** 정확도 */
  accuracy!: number;
  /** 플레이 시간(초) */
  durationSec!: number;

  constructor(partial: Partial<LeaderboardItem>) {
    Object.assign(this, partial);
  }
}

export class ChallengeLeaderboardResponseDto {
  /** 챌린지 날짜 (YYYY-MM-DD) */
  date!: string;
  /** 오늘 스니펫 ID */
  snippetId!: number;
  /** 리더보드 항목 목록 */
  items!: LeaderboardItem[];
  /** 전체 참여자 수 */
  total!: number;
  /** 내 참여 상태 */
  myRankStatus!: MyRankStatus;
  /** 내 순위 — RANKED일 때만 존재 */
  myRank?: number;

  constructor(partial: Partial<ChallengeLeaderboardResponseDto>) {
    Object.assign(this, partial);
  }
}
