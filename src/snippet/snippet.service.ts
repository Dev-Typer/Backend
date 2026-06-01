import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snippet } from './snippet.entity';
import { SnippetQueryDto } from './dto/snippet-query.dto';
import { SnippetResponseDto } from './dto/snippet-response.dto';
import { SnippetRankingResponseDto, SnippetRankingItemDto } from './dto/snippet-ranking-response.dto';
import { SnippetLanguage } from './enums/snippet-language.enum';
import { SnippetDifficulty } from './enums/snippt-difficulty.enum';
import { BusinessException } from '../common/exceptions/business.exception';
import { SnippetError } from '../common/exceptions/error-code';
import { SnippetResult } from '../snippet-result/entities/snippet-result.entity';

export interface SnippetListResponse {
    data: SnippetResponseDto[];
    total: number;
    page: number;
    size: number;
}

@Injectable()
export class SnippetService {
    constructor(
        @InjectRepository(Snippet)
        private snippetRepository: Repository<Snippet>,
        @InjectRepository(SnippetResult)
        private snippetResultRepository: Repository<SnippetResult>,
    ) {}

    // 활성화된 스니펫 목록 조회 — isActive: true 고정
    async findAll(query: SnippetQueryDto): Promise<SnippetListResponse> {
        const { language, difficulty, page = 1, size = 10 } = query;

        const qb = this.snippetRepository
            .createQueryBuilder('snippet')
            .where('snippet.isActive = true')
            .orderBy('snippet.createdAt', 'DESC');

        if (language)   qb.andWhere('snippet.language = :language', { language });
        if (difficulty) qb.andWhere('snippet.difficulty = :difficulty', { difficulty });

        const [items, total] = await qb
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();

        return { data: items.map(SnippetResponseDto.from), total, page, size };
    }

    // 단건 조회 — 활성화된 스니펫만 반환
    async findOne(id: number): Promise<SnippetResponseDto> {
        const snippet = await this.snippetRepository.findOne({
            where: { id, isActive: true },
        });
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }

    // 솔로 연습용 — 활성화된 스니펫 중 랜덤 1개 반환
    async findRandom(language?: SnippetLanguage, difficulty?: SnippetDifficulty): Promise<SnippetResponseDto> {
        const qb = this.snippetRepository
            .createQueryBuilder('snippet')
            .where('snippet.isActive = true')
            .orderBy('RANDOM()');

        if (language)   qb.andWhere('snippet.language = :language', { language });
        if (difficulty) qb.andWhere('snippet.difficulty = :difficulty', { difficulty });

        const snippet = await qb.getOne();
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }

    // 스니펫별 랭킹 — 유저별 최고 기록 기준 상위 50위
    async findRanking(snippetId: number): Promise<SnippetRankingResponseDto> {
        const snippet = await this.snippetRepository.findOne({ where: { id: snippetId } });
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);

        const rows = await this.snippetResultRepository
            .createQueryBuilder('r')
            .select('r.userId', 'userId')
            .addSelect('u.username', 'username')
            .addSelect('MAX(r.wpm)', 'wpm')
            .addSelect('MAX(r.accuracy)', 'accuracy')
            .addSelect('MAX(r.createdAt)', 'createdAt')
            .innerJoin('r.user', 'u')
            .where('r.snippetId = :snippetId', { snippetId })
            .groupBy('r.userId')
            .addGroupBy('u.username')
            .orderBy('MAX(r.wpm)', 'DESC')
            .addOrderBy('MAX(r.accuracy)', 'DESC')
            .limit(50)
            .getRawMany<{ userId: number; username: string; wpm: string; accuracy: string; createdAt: Date }>();

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

    // 데일리 챌린지용 — isDaily=true인 활성 스니펫 1개 반환 (최신순)
    async findDaily(): Promise<SnippetResponseDto> {
        const snippet = await this.snippetRepository.findOne({
            where: { isDaily: true, isActive: true },
            order: { createdAt: 'DESC' },
        });
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }
}
