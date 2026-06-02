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
          playCount: () => '"playCount" + 1',
          avgWpm: () => 'ROUND((("avgWpm" * "playCount") + :wpm) / ("playCount" + 1), 1)',
        })
        .where('id = :id', { id: dto.snippetId })
        .setParameter('wpm', dto.wpm)
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

  // 유저별 최고 기록 기준 순위 계산 — 상관 서브쿼리로 각 유저의 최고 WPM과 비교
  private async calcRank(snippetId: number, myWpm: number): Promise<number> {
    const raw = await this.snippetResultRepository
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r.userId)', 'count')
      .where('r.snippetId = :snippetId')
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('MAX(s.wpm)')
          .from(SnippetResult, 's')
          .where('s.snippetId = :snippetId')
          .andWhere('s.userId = r.userId')
          .getQuery();
        return `(${sub}) > :myWpm`;
      })
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

    // replayData에서 단어별 타이핑 시간 집계 — key를 word:wordStart로 동일 단어 중복 구분
    const wordTimes = new Map<string, { word: string; first: number; last: number }>();
    for (const event of result.replayData) {
      const word = wordAtIndex[event.index];
      if (!word) continue;
      // 단어 시작 인덱스를 찾아 키로 사용
      const wordStartIdx = event.index - (wordAtIndex.slice(0, event.index).filter(w => w === word).length > 0
        ? event.index - wordAtIndex.lastIndexOf(word, event.index - word.length + 1)
        : 0);
      const key = `${word}:${wordStartIdx}`;
      const prev = wordTimes.get(key);
      if (!prev) {
        wordTimes.set(key, { word, first: event.timestamp, last: event.timestamp });
      } else {
        prev.first = Math.min(prev.first, event.timestamp);
        prev.last  = Math.max(prev.last,  event.timestamp);
      }
    }

    // 단어별 소요 시간 (ms) 계산, 단어 길이로 정규화
    const wordSpeeds: { word: string; msPerChar: number }[] = [];
    for (const { word, first, last } of wordTimes.values()) {
      const duration = last - first || 1;
      wordSpeeds.push({ word, msPerChar: duration / word.length });
    }

    wordSpeeds.sort((a, b) => a.msPerChar - b.msPerChar);

    // 단어가 5개 미만이면 겹치지 않도록 절반씩 분리
    const half = Math.floor(wordSpeeds.length / 2);
    const topN = Math.min(5, half);
    const bestWords  = topN > 0 ? wordSpeeds.slice(0, topN).map((w) => w.word) : [];
    const worstWords = topN > 0 ? wordSpeeds.slice(-topN).reverse().map((w) => w.word) : [];

    return { bestWords, worstWords };
  }

  // replayData 기반 1초 단위 WPM 스냅샷
  private calcWpmGraph(result: SnippetResult): WpmGraphPoint[] {
    if (!result.replayData.length) return [];

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
