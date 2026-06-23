import { SnippetDifficulty } from '../../snippet/enums/snippt-difficulty.enum';

const DIFFICULTY_WEIGHT: Record<SnippetDifficulty, number> = {
  [SnippetDifficulty.EASY]: 1.0,
  [SnippetDifficulty.MEDIUM]: 1.3,
  [SnippetDifficulty.HARD]: 1.6,
};

const LENGTH_BASE = 200;
const LENGTH_WEIGHT_MIN = 0.5;
const LENGTH_WEIGHT_MAX = 2.0;

function calculateLengthWeight(contentLength: number): number {
  const raw = contentLength / LENGTH_BASE;
  return Math.min(Math.max(raw, LENGTH_WEIGHT_MIN), LENGTH_WEIGHT_MAX);
}

export function calculateNWpm(wpm: number, accuracy: number): number {
  return wpm * (accuracy / 100);
}

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

export function calculateRawCore(
  rawWpm: number,
  difficulty: SnippetDifficulty,
  contentLength: number,
): number {
  const difficultyWeight = DIFFICULTY_WEIGHT[difficulty];
  const lengthWeight = calculateLengthWeight(contentLength);

  return rawWpm * difficultyWeight * lengthWeight;
}
