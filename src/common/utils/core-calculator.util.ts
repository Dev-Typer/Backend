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

// Total CORE 계산 파라미터
export const TOTAL_CORE_TOP_N = 100;
export const TOTAL_CORE_DECAY_RATE = 0.97;

/**
 * 스니펫별 최고 core 값들을 받아
 * 상위 N개에 감쇠 가중치를 적용한 Total CORE를 계산한다.
 *
 * Total CORE = Σ floor(core_i × decayRate^i)   (i는 0부터 시작)
 */
export function calculateTotalCore(
  bestCores: number[],
  topN: number = TOTAL_CORE_TOP_N,
  decayRate: number = TOTAL_CORE_DECAY_RATE,
): number {
  const sorted = [...bestCores].sort((a, b) => b - a);
  const top = sorted.slice(0, topN);

  return top.reduce((sum, core, index) => {
    return sum + Math.floor(core * Math.pow(decayRate, index));
  }, 0);
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