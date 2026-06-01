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

      // avgWpm / playCount 원자 업데이트 — 동시 요청 race condition 방지
      await manager
        .createQueryBuilder()
        .update(Snippet)
        .set({
          playCount: () => 'play_count + 1',
          avgWpm: () => `ROUND(((avg_wpm * play_count) + ${dto.wpm}) / (play_count + 1), 1)`,
        })
        .where('id = :id', { id: dto.snippetId })
        .execute();

      return saved;
    });

    return SnippetResultResponseDto.from(result);
  }
}
