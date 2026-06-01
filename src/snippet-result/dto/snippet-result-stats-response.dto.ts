export interface WpmGraphPoint {
  second: number;
  wpm: number;
}

export interface WordStats {
  bestWords: string[];
  worstWords: string[];
}

export class SnippetResultStatsResponseDto {
  id!: number;
  snippetId!: number;
  wpm!: number;
  rawWpm!: number;
  accuracy!: number;
  durationSec!: number;
  rank!: number;
  wordStats!: WordStats;
  wpmGraph!: WpmGraphPoint[];
}
