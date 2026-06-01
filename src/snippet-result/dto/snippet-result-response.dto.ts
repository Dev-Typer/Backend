import { SnippetResult } from '../entities/snippet-result.entity';

export class SnippetResultResponseDto {
  id!: number;
  snippetId!: number;
  userId!: number;
  wpm!: number;
  rawWpm!: number;
  accuracy!: number;
  durationSec!: number;
  createdAt!: Date;

  static from(result: SnippetResult): SnippetResultResponseDto {
    const dto = new SnippetResultResponseDto();
    dto.id          = result.id;
    dto.snippetId   = result.snippetId;
    dto.userId      = result.userId;
    dto.wpm         = result.wpm;
    dto.rawWpm      = result.rawWpm;
    dto.accuracy    = result.accuracy;
    dto.durationSec = result.durationSec;
    dto.createdAt   = result.createdAt;
    return dto;
  }
}
