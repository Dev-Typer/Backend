import { ReplayEvent } from '../types/replay-event.interface';

export class SnippetResultReplayResponseDto {
  resultId!: number;
  snippetId!: number;
  replayData!: ReplayEvent[];
}
