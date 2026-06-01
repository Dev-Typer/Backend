import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SnippetResult } from './entities/snippet-result.entity';
import { Snippet } from '../snippet/snippet.entity';
import { SaveSnippetResultDto } from './dto/save-snippet-result.dto';
import { SnippetResultResponseDto } from './dto/snippet-result-response.dto';
import { SnippetResultStatsResponseDto, WpmGraphPoint, WordStats } from './dto/snippet-result-stats-response.dto';
import { SnippetResultReplayResponseDto } from './dto/snippet-result-replay-response.dto';
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

    if (!userId) return null;

    const result = await this.dataSource.transaction(async (manager) => {
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

  async findStats(id: number, userId: number): Promise<SnippetResultStatsResponseDto> {
    const result = await this.snippetResultRepository.findOne({ where: { id } });
    if (!result) throw new BusinessException(ResultError.NOT_FOUND);
    if (result.userId !== userId) throw new BusinessException(ResultError.FORBIDDEN);

    const snippet = await this.snippetRepository.findOne({ where: { id: result.snippetId } });
    if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);

    const [rank, wordStats, wpmGraph] = await Promise.all([
      this.calcRank(result.snippetId, result.wpm),
      this.calcWordStats(result, snippet.content),
      this.calcWpmGraph(result),
    ]);

    const dto = new SnippetResultStatsResponseDto();
    dto.id          = result.id;
    dto.snippetId   = result.snippetId;
    dto.wpm         = result.wpm;
    dto.rawWpm      = result.rawWpm;
    dto.accuracy    = result.accuracy;
    dto.durationSec = result.durationSec;
    dto.rank        = rank;
    dto.wordStats   = wordStats;
    dto.wpmGraph    = wpmGraph;
    return dto;
  }

  async findReplay(id: number): Promise<SnippetResultReplayResponseDto> {
    const result = await this.snippetResultRepository.findOne({ where: { id } });
    if (!result) throw new BusinessException(ResultError.NOT_FOUND);

    const dto = new SnippetResultReplayResponseDto();
    dto.resultId   = result.id;
    dto.snippetId  = result.snippetId;
    dto.replayData = result.replayData;
    return dto;
  }

  // 유저별 최고 기록 기준 순위 계산
  private async calcRank(snippetId: number, myWpm: number): Promise<number> {
    const raw = await this.snippetResultRepository
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r.userId)', 'count')
      .where((qb) => {
        const sub = qb
          .subQuery()
          .select('MAX(s.wpm)', 'max_wpm')
          .from(SnippetResult, 's')
          .where('s.snippetId = :snippetId')
          .groupBy('s.userId')
          .getQuery();
        return `(${sub}) > :myWpm`;
      })
      .andWhere('r.snippetId = :snippetId')
      .setParameters({ snippetId, myWpm })
      .getRawOne<{ count: string }>();

    return Number(raw?.count ?? 0) + 1;
  }

  // replayData 기반 단어별 타이핑 속도로 Best/Worst Words 계산
  private calcWordStats(result: SnippetResult, content: string): WordStats {
    // content를 글자 단위로 단어 매핑
    const wordAtIndex: string[] = [];
    let currentWord = '';
    let wordStart = 0;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === ' ' || content[i] === '\n') {
        if (currentWord) {
          for (let j = wordStart; j < i; j++) wordAtIndex[j] = currentWord;
        }
        wordAtIndex[i] = '';
        currentWord = '';
        wordStart = i + 1;
      } else {
        currentWord += content[i];
      }
    }
    if (currentWord) {
      for (let j = wordStart; j < content.length; j++) wordAtIndex[j] = currentWord;
    }

    // replayData에서 단어별 타이핑 시간 집계
    const wordTimes = new Map<string, { first: number; last: number }>();
    for (const event of result.replayData) {
      const word = wordAtIndex[event.index];
      if (!word) continue;
      const prev = wordTimes.get(word);
      if (!prev) {
        wordTimes.set(word, { first: event.timestamp, last: event.timestamp });
      } else {
        wordTimes.set(word, { first: Math.min(prev.first, event.timestamp), last: Math.max(prev.last, event.timestamp) });
      }
    }

    // 단어별 소요 시간 (ms) 계산, 단어 길이로 정규화
    const wordSpeeds: { word: string; msPerChar: number }[] = [];
    for (const [word, { first, last }] of wordTimes) {
      const duration = last - first || 1;
      wordSpeeds.push({ word, msPerChar: duration / word.length });
    }

    wordSpeeds.sort((a, b) => a.msPerChar - b.msPerChar);

    const bestWords  = wordSpeeds.slice(0, 5).map((w) => w.word);
    const worstWords = wordSpeeds.slice(-5).reverse().map((w) => w.word);

    return { bestWords, worstWords };
  }

  // replayData 기반 1초 단위 WPM 스냅샷
  private calcWpmGraph(result: SnippetResult): WpmGraphPoint[] {
    const graph: WpmGraphPoint[] = [];
    const totalSec = result.durationSec;

    for (let sec = 1; sec <= totalSec; sec++) {
      const correctCount = result.replayData.filter(
        (e) => e.correct && e.timestamp <= sec * 1000,
      ).length;
      const wpm = Math.round(((correctCount / 5) / (sec / 60)) * 10) / 10;
      graph.push({ second: sec, wpm });
    }

    return graph;
  }
}
