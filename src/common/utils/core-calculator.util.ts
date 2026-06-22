import { SnippetDifficulty } from '../../snippet/enums/snippt-difficulty.enum';

// 난이도 가중치
const DIFFICULTY_WEIGHT: Record<SnippetDifficulty, number> = {
  [SnippetDifficulty.EASY]: 1.0,
  [SnippetDifficulty.MEDIUM]: 1.3,
  [SnippetDifficulty.HARD]: 1.6,
};


// 길이 가중치 기준값 / 클램핑 범위
const LENGTH_BASE = 200;
const LENGTH_WEIGHT_MIN = 0.5;
const LENGTH_WEIGHT_MAX = 2.0;

/**
 * 길이 가중치 계산
 * 글자수 / 200, 0.5 ~ 2.0 사이로 클램핑
 */
function calculateLengthWeight(contentLength: number): number {
  const raw = contentLength / LENGTH_BASE;
  return Math.min(Math.max(raw, LENGTH_WEIGHT_MIN), LENGTH_WEIGHT_MAX);
}

/**
 * nWPM 계산
 * nWPM = WPM × (accuracy / 100)
 */
export function calculateNWpm(wpm: number, accuracy: number): number {
  return wpm * (accuracy / 100);
}

/**
 * CORE 계산
 * CORE = nWPM × 난이도가중치 × 길이가중치
 */
export function calculateCore(
  wpm: number,
  accuracy: number,
  difficulty: SnippetDifficulty,
  contentLength: number,
): number {
  const nWpm = calculateNWpm(wpm, accuracy);
  const difficultyWeight = DIFFICULTY_WEIGHT[difficulty];
  const lengthWeight = calculateLengthWeight(contentLength);

  return nWpm * difficultyWeight * lengthWeight;
}

/**
 * RawCore 계산
 * RawCore = RawWPM × 난이도가중치 × 길이가중치
 * (정확도 패널티 없음 — 참고용)
 */
export function calculateRawCore(
  rawWpm: number,
  difficulty: SnippetDifficulty,
  contentLength: number,
): number {
  const difficultyWeight = DIFFICULTY_WEIGHT[difficulty];
  const lengthWeight = calculateLengthWeight(contentLength);

  return rawWpm * difficultyWeight * lengthWeight;
}