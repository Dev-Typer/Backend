import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snippet } from './snippet.entity';
import { SnippetQueryDto } from './dto/snippet-query.dto';
import { SnippetResponseDto } from './dto/snippet-response.dto';
import { SnippetLanguage } from './enums/snippet-language.enum';
import { SnippetDifficulty } from './enums/snippt-difficulty.enum';
import { BusinessException } from '../common/exceptions/business.exception';
import { SnippetError } from '../common/exceptions/error-code';

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
