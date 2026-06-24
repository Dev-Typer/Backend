import { SnippetResult } from '../entities/snippet-result.entity';

export class SnippetResultResponseDto {
  id!: number;
  snippetId!: number;
  userId!: number;
  wpm!: number;
  rawWpm!: number;
  accuracy!: number;
  durationSec!: number;
  core!: number;
  isNewBest!: boolean;
  prevBestCore!: number;
  createdAt!: Date;

  static from(
    result: SnippetResult,
    prevBestCore: number,
  ): SnippetResultResponseDto {
    const dto = new SnippetResultResponseDto();
    dto.id           = result.id;
    dto.snippetId    = result.snippetId;
    dto.userId       = result.userId;
    dto.wpm          = result.wpm;
    dto.rawWpm       = result.rawWpm;
    dto.accuracy     = result.accuracy;
    dto.durationSec  = result.durationSec;
    dto.core         = Number(result.core);
    dto.prevBestCore = prevBestCore;
    dto.isNewBest    = Number(result.core) > prevBestCore;
    dto.createdAt    = result.createdAt;
    return dto;
  }
}
