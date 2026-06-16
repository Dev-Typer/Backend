import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { SnippetResultRepository } from './snippet-result.repository';
import { SnippetRepository } from '../snippet/snippet.repository';
import { SaveSnippetResultDto } from './dto/save-snippet-result.dto';
import { SnippetResultResponseDto } from './dto/snippet-result-response.dto';
import { SnippetResultStatsResponseDto, WpmGraphPoint, WordStats } from './dto/snippet-result-stats-response.dto';
import { SnippetResultReplayResponseDto } from './dto/snippet-result-replay-response.dto';
import { SnippetRankingResponseDto, SnippetRankingItemDto } from '../snippet/dto/snippet-ranking-response.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { SnippetError, ResultError } from '../common/exceptions/error-code';
import { SnippetResult } from './entities/snippet-result.entity';

@Injectable()
export class SnippetResultService {
  constructor(
    private readonly snippetResultRepository: SnippetResultRepository,
    private readonly snippetRepository: SnippetRepository,
  ) {}

  @Transactional()
  async save(
    dto: SaveSnippetResultDto,
    userId: number | null,
    isDaily = false,
  ): Promise<SnippetResultResponseDto | null> {
    const snippet = await this.snippetRepository.findById(dto.snippetId);

    if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
    if (!snippet.isActive) throw new BusinessException(SnippetError.INACTIVE);

    if (!userId) return null;

    const saved = await this.snippetResultRepository.save({
      userId,
      snippetId: dto.snippetId,
      wpm: dto.wpm,
      rawWpm: dto.rawWpm,
      accuracy: dto.accuracy,
      durationSec: dto.durationSec,
      typos: dto.typos ?? [],
      nWpm: dto.wpm * (dto.accuracy / 100),
      isDaily,
      replayData: dto.replayData ?? [],
    });
    await this.snippetRepository.incrementStats(dto.snippetId, dto.wpm);

    return SnippetResultResponseDto.from(saved);
  }

  async findStats(id: number, userId: number): Promise<SnippetResultStatsResponseDto> {
    const result = await this.snippetResultRepository.findById(id);
    if (!result) throw new BusinessException(ResultError.NOT_FOUND);
    if (result.userId !== userId) throw new BusinessException(ResultError.FORBIDDEN);

    const snippet = await this.snippetRepository.findById(result.snippetId);
    if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);

    const [rank, wordStats, wpmGraph] = await Promise.all([
      this.snippetResultRepository.calcRank(result.snippetId, result.wpm),
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

  // 스니펫별 랭킹 — 유저별 최고 기록 기준 상위 50위
  async findRanking(snippetId: number): Promise<SnippetRankingResponseDto> {
    const snippet = await this.snippetRepository.findById(snippetId);
    if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);

    const rows = await this.snippetResultRepository.findRankingBySnippet(snippetId);

    const items: SnippetRankingItemDto[] = rows.map((row, i) => {
      const item = new SnippetRankingItemDto();
      item.rank      = i + 1;
      item.userId    = row.userId;
      item.username  = row.username;
      item.wpm       = Number(row.wpm);
      item.accuracy  = Number(row.accuracy);
      item.createdAt = row.createdAt;
      return item;
    });

    const dto = new SnippetRankingResponseDto();
    dto.items = items;
    dto.total = items.length;
    return dto;
  }

  async findReplay(id: number): Promise<SnippetResultReplayResponseDto> {
    const result = await this.snippetResultRepository.findById(id);
    if (!result) throw new BusinessException(ResultError.NOT_FOUND);

    const dto = new SnippetResultReplayResponseDto();
    dto.resultId   = result.id;
    dto.snippetId  = result.snippetId;
    dto.replayData = result.replayData;
    return dto;
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
