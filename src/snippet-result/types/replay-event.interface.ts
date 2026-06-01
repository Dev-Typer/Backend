export interface ReplayEvent {
  index: number;
  char: string;
  timestamp: number;
  correct: boolean;
}