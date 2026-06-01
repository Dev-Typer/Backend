import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SnippetResult } from './entities/snippet-result.entity';
import { Snippet } from '../snippet/snippet.entity';
import { SaveSnippetResultDto } from './dto/save-snippet-result.dto';
import { SnippetResultResponseDto } from './dto/snippet-result-response.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { SnippetError, ResultError } from '../common/exceptions/error-code';

@Injectable()
export class SnippetResultService {
  constructor(
    @InjectRepository(SnippetResult)
    private snippetResultRepository: Repository<SnippetResult>,
    @InjectRepository(Snippet)
    private snippetRepository: Repository<Snippet>,
    private dataSource: DataSource,
  ) {}

  async save(
    dto: SaveSnippetResultDto,
    userId: number | null,
  ): Promise<SnippetResultResponseDto | null> {
    const snippet = await this.snippetRepository.findOne({
      where: { id: dto.snippetId },
    });

    if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
    if (!snippet.isActive) throw new BusinessException(SnippetError.INACTIVE);

    // 유효성 검사 — DTO @Max(300) 으로 처리되지만 명시적 에러코드 위해 재검사
    if (dto.wpm <= 0) throw new BusinessException(ResultError.INVALID_WPM);
    if (dto.wpm > 300) throw new BusinessException(ResultError.WPM_TOO_HIGH);
    if (dto.accuracy < 0 || dto.accuracy > 100) throw new BusinessException(ResultError.INVALID_ACCURACY);
    if (dto.durationSec < 3) throw new BusinessException(ResultError.DURATION_TOO_SHORT);

    // 비로그인 → 저장 스킵
    if (!userId) return null;

    const result = await this.dataSource.transaction(async (manager) => {
      // 결과 저장
      const saved = await manager.save(
        SnippetResult,
        manager.create(SnippetResult, {
          userId,
          snippetId: dto.snippetId,
          wpm: dto.wpm,
          rawWpm: dto.rawWpm,
          accuracy: dto.accuracy,
          durationSec: dto.durationSec,
          typos: dto.typos ?? [],
          replayData: dto.replayData ?? [],
        }),
      );

      // avgWpm / playCount 업데이트
      const newPlayCount = snippet.playCount + 1;
      const newAvgWpm = ((snippet.avgWpm * snippet.playCount) + dto.wpm) / newPlayCount;

      await manager.update(Snippet, dto.snippetId, {
        playCount: newPlayCount,
        avgWpm: Math.round(newAvgWpm * 10) / 10,
      });

      return saved;
    });

    return SnippetResultResponseDto.from(result);
  }
}
